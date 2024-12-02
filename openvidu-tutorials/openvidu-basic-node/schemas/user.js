const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // 유저가 설정한 아이디
  username: {
    type: String,
    required: true,
    unique: true, // 중복된 닉네임 방지
  },
  // 비밀번호 (소셜 로그인의 경우 필수 아님)
  password: {
    type: String,
    required: function () {
      return this.provider === "normal"; // 일반 로그인 사용자만 필수
    },
  },
  // 카카오 또는 소셜 로그인에서 부여한 고유 ID
  socialId: {
    type: String,
    unique: true, // 고유한 소셜 ID
    sparse: true, // null 값을 허용하면서 unique 제약 조건 설정
  },
  // 어떤 소셜 로그인을 사용했는지 (예: 'kakao', 'normal')
  provider: {
    type: String,
    required: true,
    default: "normal", // 기본값은 일반 로그인
  },
  // 프로필 이미지 (S3에 저장된 URL)
  profileImageUrl: {
    type: String,
    default: "", // 기본값 빈 문자열
  },
  // 총 참가 토론 횟수
  totalParticipations: {
    type: Number,
    default: 0,
  },
  // 총 이긴 토론 횟수
  totalWins: {
    type: Number,
    default: 0,
  },
  // 1등 토론 횟수
  firstPlaceWins: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("user", userSchema);
