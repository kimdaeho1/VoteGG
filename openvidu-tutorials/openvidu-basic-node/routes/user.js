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
      // Authorization Code로 카카오 액세스 토큰 요청
      const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: '13ff40fb648001aaef443060fec9946a',
          redirect_uri: 'https://recordstudio.site:8443/api/user/auth/kakao/callback',
          code: code,
        },
      });
  
      const { access_token } = tokenResponse.data;
  
      // 카카오 액세스 토큰으로 사용자 정보 요청
      const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
  
      const { id, properties } = userInfoResponse.data;
      const nickname = properties ? properties.nickname : null;
  
      if (!nickname) {
        return res.status(400).json({ message: '사용자 정보에 닉네임이 없습니다.' });
      }
  
      let existingUser = await user.findOne({ socialId: id });
  
      if (!existingUser) {
        // 신규 사용자 생성
        existingUser = new user({
          username: nickname,
          socialId: id,
          provider: 'kakao',
        });
        await existingUser.save();
      }
  
      // JWT 생성
      const payload = {
        userId: existingUser._id,
        username: existingUser.username,
        profileImageUrl: existingUser.profileImageUrl || '',
        totalParticipations: existingUser.totalParticipations || 0,
        totalWins: existingUser.totalWins || 0,
        firstPlaceWins: existingUser.firstPlaceWins || 0,
        provider: 'kakao',
        socialId: id,
      };
  
      const jwtToken = jwt.sign(payload, 'magic_number', { expiresIn: '1h' });
  
      // 지금 카카오 서버의 콜백으로 불러진거라 리디렉션을 강제로 해야되서 쿠키에 저장하고 jwt토큰은
      // /(즉 home) 홈 컴포넌트에서 httponly옵션을 false로 함으로써 document.cookie로 그걸 읽어서 
      //token인걸 똑같인 localstorage에 저장해주는 방식으로 사용함
      // 쿠키 저장
      res.cookie('token', jwtToken, { httpOnly: false, secure: true }); // JWT 토큰 
      res.cookie('access_token', access_token, { httpOnly: false, secure: true }); // 카카오 액세스 토큰
  
      // 리디렉션 처리
      if (existingUser) {
        // 기존 가입자 -> 홈으로 리디렉션
        return res.redirect('https://recordstudio.site:8443/');
      } else {
        // 신규 가입자 -> 사용자 정보 입력 페이지로 리디렉션
        return res.redirect(`https://recordstudio.site:8443/set-username?kakaoId=${id}&nickname=${nickname}`);
      }
    } catch (error) {
      console.error('카카오 로그인 처리 오류:', error);
      res.status(500).json({ message: '로그인 오류', error: error.message });
    }
  });
   

module.exports = router; // 라우터 내보내기