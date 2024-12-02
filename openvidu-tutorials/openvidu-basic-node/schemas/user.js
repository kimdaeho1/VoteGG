const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImageUrl: { // S3에 저장된 프로필 이미지 URL
    type: String,
    default: "", // 기본값 빈 문자열
  },
  totalParticipations: { // 총 참가 토론 횟수
    type: Number,
    default: 0,
  },
  totalWins: { // 총 이긴 토론 횟수
    type: Number,
    default: 0,
  },
  firstPlaceWins: { // 1등 토론 횟수
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("user", userSchema);
