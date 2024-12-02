const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const user = require("../schemas/user"); // 'user' 소문자로 모델 불러오기

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


module.exports = router; // 라우터 내보내기