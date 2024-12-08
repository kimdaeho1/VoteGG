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

  createdby: {
    type: String,
    required: true },

  other: {
    type: String,
    default: "", // 기본값 빈 문자열
  },

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
  tags: {
    type: [String], // 태그 배열로 m저장
    default: [],
  },

  redScore: {
    type: Number,
    default: 0,
  },
  
  blueScore: {
    type: Number,
    default: 0,
  },

  maxViewers : {
    type: Number,
    default: 0,
  },

  // leftUserArgument : {
  //   type: Map,
  //   of: String, // 딕셔너리 형태의 value는 숫자 (기본값: 0)
  //   default: {}, // 초기값은 빈 딕셔너리
  // },

  // rightUserArgument : {
  //   type: Map,
  //   of: String, // 딕셔너리 형태의 value는 숫자 (기본값: 0)
  //   default: {}, // 초기값은 빈 딕셔너리
  // },

});


module.exports = mongoose.model("room", roomSchema);
