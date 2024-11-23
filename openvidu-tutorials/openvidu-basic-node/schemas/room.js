const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
  },
  
  roomname: {
    type: String,
    required: true,
    unique: true,
  },

  memberCount: {
    type: Number,
    default: 0,
  },

  createdby: {
    type: String,
    required: true,
  },

  // (초대기능)
  invitees: {
    type: [String], // 초대된 사람들의 사용자 ID나 닉네임 배열
    default: [],
  },

});

module.exports = mongoose.model("room", roomSchema);