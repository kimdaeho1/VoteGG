const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true },

  roomname: {
    type: String,
    required: true,
    unique: true },

  memberCount: {
    type: Number,
    default: 0 },

  createdby: {
    type: String,
    required: true },

  invitees: {
    type: [String],
    default: [] },

  // 참가자 딕셔너리
  participant: {
    type: Map,
    of: Number, // 딕셔너리 형태의 value는 숫자 (기본값: 0)
    default: {}, // 초기값은 빈 딕셔너리
  },

  thumbnail : {
    type : String,
    default : "",
  },
});

module.exports = mongoose.model("room", roomSchema);
