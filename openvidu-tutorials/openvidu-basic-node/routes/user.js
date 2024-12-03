const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const user = require("../schemas/user"); // 'user' 소문자로 모델 불러오기
const axios = require("axios"); // axios 추가
const AWS = require("aws-sdk");
const multer = require("multer"); // multer 패키지 가져오기
require("dotenv").config(!!process.env.CONFIG ? { path: process.env.CONFIG } : {});

const router = express.Router(); // 라우터 정의

const upload = multer({ storage: multer.memoryStorage() });
const { KAKAO_CLIENT_ID, KAKAO_REDIRECT_URI, JWT_SECRET } = process.env; // 환경 변수 추출

// 회원가입 API
router.post("/users", async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  const nicknameRegex = /^[a-zA-Z0-9]{3,}$/;
  if (!nicknameRegex.test(username)) {
    return res
      .status(400)
      .json({ message: "닉네임은 최소 3자 이상이어야 하며, 알파벳과 숫자만 사용 가능합니다." });
  }

  if (password.length < 4 || password.includes(username)) {
    return res.status(400).json({
      message: "비밀번호는 최소 4자 이상이어야 하며 닉네임을 포함할 수 없습니다.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "비밀번호가 비밀번호 확인과 일치하지 않습니다." });
  }

  const existingUser = await user.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: "중복된 닉네임입니다." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new user({ username, password: hashedPassword });
  await newUser.save();

  res.status(201).json({ message: "회원가입 완료!" });
});

// 로그인 API
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await user.findOne({ username });

  if (!existingUser || !(await bcrypt.compare(password, existingUser.password))) {
    return res.status(400).json({ message: "닉네임 또는 패스워드를 확인해주세요" });
  }

  const token = jwt.sign(
    {
      userId: existingUser._id,
      username: existingUser.username,
      profileImageUrl: existingUser.profileImageUrl || "",
      totalParticipations: existingUser.totalParticipations || 0,
      totalWins: existingUser.totalWins || 0,
      firstPlaceWins: existingUser.firstPlaceWins || 0,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.cookie("authorization", `Bearer ${token}`);
  res.json({ message: "로그인 성공", token });
});

// 카카오 로그인 요청을 카카오 인증 페이지로 리디렉션
router.get("/auth/kakao", (req, res) => {
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;
  res.redirect(kakaoAuthUrl);
});

// 리디렉션 후 로그인 콜백
router.get("/auth/kakao/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post("https://kauth.kakao.com/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        client_id: KAKAO_CLIENT_ID,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
      },
    });

    const { access_token } = tokenResponse.data;

    const userInfoResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, properties } = userInfoResponse.data;
    const nickname = properties?.nickname;

    if (!nickname) {
      return res.status(400).json({ message: "사용자 정보에 닉네임이 없습니다." });
    }

    let existingUser = await user.findOne({ socialId: id });

    if (existingUser) {
      const jwtToken = jwt.sign(
        {
          userId: existingUser._id,
          username: existingUser.username,
          profileImageUrl: existingUser.profileImageUrl || "",
          totalParticipations: existingUser.totalParticipations || 0,
          totalWins: existingUser.totalWins || 0,
          firstPlaceWins: existingUser.firstPlaceWins || 0,
          provider: existingUser.provider,
          socialId: id,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.cookie("token", jwtToken, { httpOnly: false, secure: true });
      res.cookie("access_token", access_token, { httpOnly: false, secure: true });
      return res.redirect("https://recordstudio.site:8443/");
    }

    res.cookie("access_token", access_token, { httpOnly: false, secure: true });
    return res.redirect(`https://recordstudio.site:8443/set-username?kakaoId=${id}&nickname=${nickname}`);
  } catch (error) {
    console.error("카카오 로그인 처리 오류:", error);
    res.status(500).json({ message: "로그인 오류", error: error.message });
  }
});

// 최초 가입 시 아이디 설정 API
router.post("/set-username", async (req, res) => {
  const { socialId, username, provider } = req.body;

  // 필수 정보 확인
  if (!socialId || !username || !provider) {
    return res.status(400).json({ message: "필수 정보가 누락되었습니다." });
  }

  // 닉네임 검증
  const nicknameRegex = /^[a-zA-Z0-9]{3,}$/;
  if (!nicknameRegex.test(username)) {
    return res.status(400).json({
      message: "닉네임은 최소 3자 이상이어야 하며, 알파벳과 숫자만 사용 가능합니다.",
    });
  }

  try {
    // 중복 닉네임 확인
    if (await user.findOne({ username })) {
      return res.status(400).json({ message: "중복된 아이디입니다." });
    }

    // 새 사용자 생성
    const newUser = new user({ username, socialId, provider });
    await newUser.save();

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username, provider: newUser.provider },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 쿠키에 토큰 저장
    res.cookie("token", token, { httpOnly: false, secure: true });
    res.status(200).json({ message: "아이디 설정 완료" });
  } catch (error) {
    console.error("아이디 설정 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});


/*================================프로필 사진 s3 및 쿠키 토큰 재갱신 =========================*/
// S3 설정
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-northeast-2", // S3 리전
});

// 프로필 이미지 업로드 API
router.post("/profile-image", upload.single("profileImage"), async (req, res) => {
  try {
    const { file } = req;
    const token = req.headers.authorization?.split(" ")[1];

    if (!file) {
      return res.status(400).json({ message: "파일이 필요합니다." });
    }

    if (!token) {
      return res.status(401).json({ message: "JWT 토큰이 필요합니다." });
    }

    // JWT 토큰 검증 및 디코딩
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "유효하지 않은 JWT 토큰입니다." });
    }

    // S3 업로드 설정
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `profile-images/${Date.now()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // S3 업로드 실행
    const uploadResult = await s3.upload(uploadParams).promise();
    const profileImageUrl = uploadResult.Location;

    // MongoDB에서 유저 업데이트
    const currentUser = await user.findOne({ username: decoded.username });
    if (!currentUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    currentUser.profileImageUrl = profileImageUrl;
    await currentUser.save();

    // 새로운 JWT 발급
    const newToken = jwt.sign(
      {
        userId: currentUser._id,
        username: currentUser.username,
        profileImageUrl: currentUser.profileImageUrl,
        totalParticipations: currentUser.totalParticipations,
        totalWins: currentUser.totalWins,
        firstPlaceWins: currentUser.firstPlaceWins,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", newToken, { httpOnly: false, secure: true });
    res.status(200).json({ profileImageUrl, token: newToken });
  } catch (error) {
    console.error("파일 업로드 중 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});


module.exports = router;
