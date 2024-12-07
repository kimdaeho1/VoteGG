const mongoose = require("mongoose");

const debateResultSchema = new mongoose.Schema({
  roomName: { // 토론 제목
    type: String,
    required: true,
  },
  tags: { // 토론 태그
    type: [String],
    default: [],
  },
  redScore: { // Red 팀 투표 결과
    type: Number,
    default: 0,
  },
  blueScore: { // Blue 팀 투표 결과
    type: Number,
    default: 0,
  },
  maxViewers: { // 최고 시청자 수
    type: Number,
    default: 0,
  },
  participantsArray: { // 참가자 배열 (key-value 형태)
    type: [[String, Number]], // [key, value] 쌍의 배열
    default: [],
  },
  createdAt: { // 토론 종료 시간
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DebateResult", debateResultSchema);
