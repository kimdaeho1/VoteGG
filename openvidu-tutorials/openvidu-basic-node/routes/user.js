const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const user = require("../schemas/user"); // 'user' 소문자로 모델 불러오기
const axios = require("axios"); // axios 추가

const router = express.Router(); // 라우터 정의

// 회원가입 API
router.post("/users", async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    // 닉네임 및 비밀번호 유효성 검사
    const nicknameRegex = /^[a-zA-Z0-9]{3,}$/;
    if (!nicknameRegex.test(username)) {
        return res.status(400).json({ message: "닉네임은 최소 3자 이상이어야 하며, 알파벳과 숫자만 사용 가능합니다." });
    }

    if (password.length < 4 || password.includes(username)) {
        return res.status(400).json({ message: "비밀번호는 최소 4자 이상이어야 하며 닉네임을 포함할 수 없습니다." });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "비밀번호가 비밀번호 확인과 일치하지 않습니다." });
    }

    // 중복 사용자 검사
    const existingUser = await user.findOne({ username }); // 'user' 모델로 찾기
    if (existingUser) {
        return res.status(400).json({ message: "중복된 닉네임입니다." });
    }

    // 비밀번호 해싱 및 사용자 저장
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new user({ username, password: hashedPassword }); // 'user' 모델로 새 사용자 저장
    await newUser.save();

    res.status(201).json({ message: "회원가입 완료!" });
});

// 로그인 API
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const existingUser = await user.findOne({ username }); // 'user' 모델로 사용자 찾기

    if (!existingUser) {
        return res.status(400).json({ message: "닉네임 또는 패스워드를 확인해주세요" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordCorrect) {
        return res.status(400).json({ message: "닉네임 또는 패스워드를 확인해주세요" });
    }

    // 데이터 기본값 처리
    const profileImageUrl = existingUser.profileImageUrl || ""; // 없으면 빈 문자열
    const totalParticipations = existingUser.totalParticipations || 0; // 없으면 0
    const totalWins = existingUser.totalWins || 0; // 없으면 0
    const firstPlaceWins = existingUser.firstPlaceWins || 0; // 없으면 0

    // 로그인 성공 시 JWT 발급
    const token = jwt.sign(
        {
            userId: existingUser._id,
            username: existingUser.username,
            profileImageUrl,
            totalParticipations,
            totalWins,
            firstPlaceWins,
        },
        "magic_number",
        { expiresIn: "1h" }
    );

    res.cookie("authorization", `Bearer ${token}`); // 쿠키 설정
    res.json({ 
        message: "로그인 성공",
        token, // 토큰 반환
    });
});


// ================== 소셜로그인 이후 =========================== //

// 카카오 로그인 요청을 카카오 인증 페이지로 리디렉션
router.get('/auth/kakao', (req, res) => {
    const kakaoAuthUrl = 'https://kauth.kakao.com/oauth/authorize' +
    '?client_id=13ff40fb648001aaef443060fec9946a' +
    '&redirect_uri=https://recordstudio.site:8443/api/user/auth/kakao/callback' +
    '&response_type=code';
    res.redirect(kakaoAuthUrl);
  }); 



 // 리디렉션 후 로그인시 콜백함수
 router.get('/auth/kakao/callback', async (req, res) => {
  const { code } = req.query;

  try {
      // 카카오 액세스 토큰 요청
      const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
          params: {
              grant_type: 'authorization_code',
              client_id: '13ff40fb648001aaef443060fec9946a',
              redirect_uri: 'https://recordstudio.site:8443/api/user/auth/kakao/callback',
              code,
          },
      });

      const { access_token } = tokenResponse.data;

      // 카카오 사용자 정보 요청
      const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
          headers: { Authorization: `Bearer ${access_token}` },
      });

      const { id, properties } = userInfoResponse.data;
      const nickname = properties?.nickname;

      if (!nickname) {
          return res.status(400).json({ message: '사용자 정보에 닉네임이 없습니다.' });
      }

      // DB에서 소셜 ID로 사용자 찾기
      let existingUser = await user.findOne({ socialId: id });

      if (existingUser) {
          // 기존 유저 - JWT 생성
          const jwtToken = jwt.sign(
              {
                  userId: existingUser._id,
                  username: existingUser.username,
                  profileImageUrl: existingUser.profileImageUrl || '',
                  totalParticipations: existingUser.totalParticipations || 0,
                  totalWins: existingUser.totalWins || 0,
                  firstPlaceWins: existingUser.firstPlaceWins || 0,
                  provider: existingUser.provider,
                  socialId: id,
              },
              'magic_number',
              { expiresIn: '1h' }
          );

          // 쿠키에 저장 후 홈으로 리디렉션
          res.cookie('token', jwtToken, { httpOnly: false, secure: true });
          res.cookie('access_token', access_token, { httpOnly: false, secure: true });
          return res.redirect('https://recordstudio.site:8443/');
      }

      // 신규 유저 - 리디렉션하여 username 설정
      res.cookie('access_token', access_token, { httpOnly: false, secure: true }); // 액세스 토큰 저장
      return res.redirect(`https://recordstudio.site:8443/set-username?kakaoId=${id}&nickname=${nickname}`);
  } catch (error) {
      console.error('카카오 로그인 처리 오류:', error);
      res.status(500).json({ message: '로그인 오류', error: error.message });
  }
});


// 최초가입시 아이디 설정 api
router.post("/set-username", async (req, res) => {
  const { socialId, username, provider, nickname } = req.body;

  if (!socialId || !username || !provider) {
      return res.status(400).json({ message: "필수 정보가 누락되었습니다." });
  }

  try {
      // 중복된 아이디 검사
      const existingUsername = await user.findOne({ username });
      if (existingUsername) {
          return res.status(400).json({ message: "중복된 아이디입니다." });
      }

      // 신규 유저 저장
      const newUser = new user({
          username,
          socialId,
          provider,
          profileImageUrl: "", // 초기 프로필 이미지
          totalParticipations: 0,
          totalWins: 0,
          firstPlaceWins: 0,
      });

      await newUser.save();

      // JWT 생성
      const token = jwt.sign(
          {
              userId: newUser._id,
              username: newUser.username,
              provider: newUser.provider,
              socialId: newUser.socialId,
              profileImageUrl: newUser.profileImageUrl,
              totalParticipations: newUser.totalParticipations,
              totalWins: newUser.totalWins,
              firstPlaceWins: newUser.firstPlaceWins,
          },
          "magic_number", // 시크릿 키
          { expiresIn: "1h" }
      );

      // JWT를 쿠키에 저장
      res.cookie('token', token, { httpOnly: false, secure: true }); // HTTP-only는 false로 설정
      res.status(200).json({ message: "아이디 설정 완료" });
  } catch (error) {
      console.error("아이디 설정 오류:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});



module.exports = router; // 라우터 내보내기