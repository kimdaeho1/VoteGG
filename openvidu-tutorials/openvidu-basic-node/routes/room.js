const express = require("express");
const Room = require("../schemas/room");

const router = express.Router();

const getNextRoomNumber = async (maxRooms = 2 << 4) => {
  const rooms = await Room.find({}, { roomNumber: 1 }).sort({ roomNumber: 1 }).exec();
  const usedNumbers = new Set(rooms.map((room) => room.roomNumber));

  for (let i = 1; i <= maxRooms; i++) {
    if (!usedNumbers.has(i)) {
      return i;
    }
  }

  throw new Error("No available room numbers.");
};


// 방 생성 API
router.post("/roomCreate", async (req, res) => {
  try {
    const { roomname, createdby } = req.body;

    // 다음 방 번호 가져오기
    const roomNumber = await getNextRoomNumber(16);

    const newRoom = new Room({
      roomNumber,
      roomname,
      createdby,
    });

    const savedRoom = await newRoom.save();
    
    // 기존 코드
    // res.status(201).json(savedRoom);

    // 초대 코드
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