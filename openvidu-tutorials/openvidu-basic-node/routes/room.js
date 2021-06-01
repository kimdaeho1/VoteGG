const express = require("express");
const Room = require("../schemas/room");
const { v4 } = require('uuid'); // 방 uuid 생성

const router = express.Router();
const max_Room_Count = 2 << 4 // 최대 방 갯수

const getNextRoomNumber = async (maxRooms = max_Room_Count) => {
  const rooms = await Room.countDocuments({}); // 방 갯수 가져옴

  const uuid = () => {
    const tokens = v4().split('-')
    return tokens[2] + tokens[1] + tokens[0] + tokens[3] + tokens[4];
  };
 
  if (rooms < maxRooms){
    return uuid(); // 새 방 uuid 반환
  }
  else{
    throw new Error("No available room numbers."); // 만들 수 있는 방 여유 없음
  }  
};


// 방 생성 API
router.post("/roomCreate", async (req, res) => {
  try {
    const { roomname, createdby } = req.body;

    // 다음 방 번호 가져오기
    const roomNumber = await getNextRoomNumber(max_Room_Count);

    const newRoom = new Room({
      roomNumber,
      roomname,
      createdby,
    });

    const savedRoom = await newRoom.save(); // 방 정보 저장

    //초대 코드
    res.status(201).json({
      roomNumber: savedRoom.roomNumber,
      roomname: savedRoom.roomname,
      createdby: savedRoom.createdby,
      inviteLink: `/room/${savedRoom.roomNumber}`, // 초대 링크
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/roomList", async (req, res) => {
  try {
    const rooms = await Room.find().select("roomNumber roomname createdby memberCount image"); // 필요한 필드만 선택
    res.status(200).json(rooms);
  } catch (error) {
    console.error("방 목록 가져오기 실패:", error.message);
    res.status(500).json({ error: "방 목록을 가져오는 중 오류가 발생했습니다." });
  }
});

module.exports = router;