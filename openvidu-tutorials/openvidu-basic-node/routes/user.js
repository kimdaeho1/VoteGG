const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const user = require("../schemas/user"); // 'user' 소문자로 모델 불러오기
const axios = require("axios"); // axios 추가
require("dotenv").config(!!process.env.CONFIG ? { path: process.env.CONFIG } : {});

const router = express.Router(); // 라우터 정의

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

  if (!socialId || !username || !provider) {
    return res.status(400).json({ message: "필수 정보가 누락되었습니다." });
  }

  try {
    if (await user.findOne({ username })) {
      return res.status(400).json({ message: "중복된 아이디입니다." });
    }

    const newUser = new user({ username, socialId, provider });
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username, provider: newUser.provider },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, { httpOnly: false, secure: true });
    res.status(200).json({ message: "아이디 설정 완료" });
  } catch (error) {
    console.error("아이디 설정 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
