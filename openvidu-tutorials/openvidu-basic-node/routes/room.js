const express = require("express");
const Room = require("../schemas/room");
const { v4 } = require("uuid"); // UUID 생성기

const router = express.Router();
const max_Room_Count = 2 << 4; // 최대 방 갯수 (32)

//썸네일 관련 라이브러리
const multer = require("multer");
// const upload = multer({ dest : "public/uploads/"});
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/"); // 파일이 저장될 경로
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // 파일 확장자 추출
    const baseName = path.basename(file.originalname, ext); // 파일 이름만 추출
    cb(null, `${baseName}-${Date.now()}${ext}`); // 파일 이름에 타임스탬프 추가
  },
});

const upload = multer({ storage }); // 변경된 storage 설정 사용

// UUID 생성 함수
const getNextRoomNumber = async (maxRooms = max_Room_Count) => {
  const rooms = await Room.countDocuments({});
  const uuid = () => {
    const tokens = v4().split("-");
    return tokens[2] + tokens[1] + tokens[0] + tokens[3] + tokens[4];
  };

  if (rooms < maxRooms) {
    return uuid();
  } else {
    throw new Error("No available room numbers.");
  }
};

// 토큰에서 사용자 이름 추출 함수
const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    console.log("토큰 디코드 결과:", payload);
    return payload.username;
  } catch (error) {
    console.error("토큰 파싱 실패:", error.message);
    return null;
  }
};

// 방 생성 API
router.post("/roomCreate", upload.single("thumbnail"), async (req, res) => {
  try {

    console.log("요청 데이터(req.body):", req.body); // 클라이언트에서 전송한 텍스트 데이터 확인
    console.log("업로드된 파일(req.file):", req.file); // multer로 처리된 파일 정보 확인

    const { roomname, createdby } = req.body;
    const roomNumber = await getNextRoomNumber(max_Room_Count);

    // 썸네일 파일 처리
    const thumbnail = req.file ? `/uploads/${req.file.filename}` : "";

    const newRoom = new Room({
      roomNumber,
      roomname,
      createdby,
      participant: { [createdby]: 0 },
      thumbnail, //썸네일 추가
    });

    const savedRoom = await newRoom.save();
    console.log("방 생성됨:", savedRoom);

    res.status(201).json({
      roomNumber: savedRoom.roomNumber,
      roomname: savedRoom.roomname,
      createdby: savedRoom.createdby,
      thumbnail: savedRoom.thumbnail,
      inviteLink: `/room/${savedRoom.roomNumber}`,
    });
  } catch (error) {
    console.error("방 생성 실패:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 방 목록 조회 API
router.get("/roomList", async (req, res) => {
  try {
    const rooms = await Room.find().select(
      "roomNumber roomname createdby memberCount thumbnail"
    );
    console.log("방 목록 응답:", rooms);
    res.status(200).json(rooms);
  } catch (error) {
    console.error("방 목록 가져오기 실패:", error.message);
    res.status(500).json({ error: "방 목록을 가져오는 중 오류가 발생했습니다." });
  }
});

// 방 참가자 추가 API
router.post("/participant", async (req, res) => {
  try {
    const { roomNumber, token } = req.body;

    if (!roomNumber || !token) {
      return res.status(400).json({ error: "roomNumber와 token이 필요합니다." });
    }

    const userId = getUsernameFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
    }

    const room = await Room.findOne({ roomNumber });
    if (!room) {
      return res.status(404).json({ error: "방을 찾을 수 없습니다." });
    }

    if (!room.participant.has(userId)) {
      room.participant.set(userId, 0);
      room.memberCount += 1;
      await room.save();
      console.log("참가자 추가 완료:", room.participant);
    } else {
      console.log("참가자는 이미 존재합니다:", userId);
    }

    res.status(200).json({ message: "참가자가 추가되었습니다.", participant: room.participant });
  } catch (error) {
    console.error("참가자 추가 실패:", error.message);
    res.status(500).json({ error: "참가자를 추가하는 중 오류가 발생했습니다." });
  }
});

// 특정 방 참가자 목록 조회 API
router.get("/:roomId/participants", async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findOne({ roomNumber: roomId });

    if (!room) {
      return res.status(404).json({ error: "방을 찾을 수 없습니다." });
    }

    const participantsArray = Array.from(room.participant.entries());
    console.log("참가자 목록 응답 (서버):", participantsArray);
    res.status(200).json(participantsArray);
  } catch (error) {
    console.error("참가자 목록 가져오기 실패:", error.message);
    res.status(500).json({ error: "참가자 목록을 가져오는 중 오류가 발생했습니다." });
  }
});

// 특정 방 디버그 API
router.get("/:roomId/debugParticipants", async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findOne({ roomNumber: roomId });
    if (!room) {
      return res.status(404).json({ error: "방을 찾을 수 없습니다." });
    }

    console.log("참가자 디버그 목록:", Array.from(room.participant.entries()));
    res.status(200).json({ participant: Array.from(room.participant.entries()) });
  } catch (error) {
    console.error("디버그 실패:", error.message);
    res.status(500).json({ error: "참가자 디버그 중 오류가 발생했습니다." });
  }
});



// 투표 POST 요청 처리
router.post("/vote", async (req, res) => {
  const { roomNumber, participant, votes } = req.body;

  try {
    const room = await Room.findOne({ roomNumber });

    if (!room) {
      return res.status(404).json({ error: "방을 찾을 수 없습니다." });
    }

    if (!room.participant.has(participant)) {
      return res.status(404).json({ error: "참가자를 찾을 수 없습니다." });
    }

    // 투표 수 증가
    const currentVotes = room.participant.get(participant) || 0;
    room.participant.set(participant, currentVotes + votes);

    await room.save();
    console.log(`투표 완료: ${participant}에게 ${votes} 투표 추가.`);
    res.status(200).json({
      message: "투표 완료",
      participant: Array.from(room.participant.entries()),
    });
  } catch (error) {
    console.error("투표 처리 실패:", error.message);
    res.status(500).json({ error: "투표 처리 중 오류가 발생했습니다." });
  }
});

// 특정 방 정보 가져오기 API
router.get("/rooms/:roomId", async (req, res) => {
  const roomId = req.params.roomId;
  try {
    const room = await Room.findOne({ roomNumber: roomId }).select(
      "roomNumber roomname createdby memberCount"
    );
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.status(200).json(room);
  } catch (error) {
    console.error("방 정보 가져오기 실패:", error.message);
    res.status(500).json({ error: "방 정보를 가져오는 중 오류가 발생했습니다." });
  }
});


module.exports = router;
