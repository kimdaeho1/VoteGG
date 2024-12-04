const express = require("express");
const Room = require("../schemas/room");
const { v4 } = require("uuid"); // UUID 생성기
const { usersNumber } = require('../schemas/usersNumber');
const router = express.Router();
const max_Room_Count = 2 << 4; // 최대 방 갯수 (32)
const user = require("../schemas/user");
//썸네일 관련 라이브러리
const AWS = require("aws-sdk");
const multer = require("multer");
// const upload = multer({ dest : "public/uploads/"});
const path = require("path");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/uploads/"); // 파일이 저장될 경로
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname); // 파일 확장자 추출
//     const baseName = path.basename(file.originalname, ext); // 파일 이름만 추출
//     cb(null, `${baseName}-${Date.now()}${ext}`); // 파일 이름에 타임스탬프 추가
//   },
// });

// S3 설정
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-northeast-2", // S3 리전
});

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "thumbnail") {
      cb(null, true);
    } else {
      cb(new Error("Unexpected field"));
    }
  },
});

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
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    const { roomname, createdby, thumbnail, tags } = req.body;

    // 태그 처리
    let parsedTags = [];
    try {
      parsedTags = JSON.parse(req.body.tags);
    } catch (error) {
      console.warn("태그 파싱 오류:", error.message);
    }
    
    // S3에 썸네일 업로드
    let thumbnailUrl = "";
    if (req.file) {
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `room-thumbnails/${Date.now()}_${req.file.originalname}`, // 고유 파일명 생성
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      try {
        const uploadResult = await s3.upload(uploadParams).promise();
        thumbnailUrl = uploadResult.Location; // 업로드된 URL
      } catch (uploadError) {
        console.error("S3 업로드 실패:", uploadError.message);
        return res.status(500).json({ error: "S3 업로드 중 오류가 발생했습니다." });
      }
    }

    const roomNumber = await getNextRoomNumber();

    // MongoDB에 방 정보 저장
    const newRoom = new Room({
      roomNumber,
      roomname,
      createdby,
      participant: { [createdby]: 0 },
      thumbnail: thumbnailUrl, // 업로드된 썸네일 URL
      tags: parsedTags,
    });

    const savedRoom = await newRoom.save();

    res.status(201).json({
      roomNumber: savedRoom.roomNumber,
      roomname: savedRoom.roomname,
      createdby: savedRoom.createdby,
      thumbnail: savedRoom.thumbnail,
      tags: savedRoom.tags,
      inviteLink: `/room/${savedRoom.roomNumber}`,
    });
  } catch (error) {
    console.error("방 생성 실패:", error.message);
    res.status(500).json({ error: "방 생성 중 오류가 발생했습니다." });
  }
});

// 방 목록 조회 API
router.get("/roomList", async (req, res) => {
  try {
    // 데이터베이스에서 방 정보 가져오기
    const rooms = await Room.find().select(
      "roomNumber roomname createdby thumbnail tags participant" // memberCount 제외
    );

    // usersNumber 기반으로 memberCount 업데이트
    const updatedRooms = rooms.map(room => {
      const roomId = room.roomNumber.toString(); // roomNumber를 문자열로 변환
      const currentUserCount = usersNumber[roomId] || 0; // usersNumber에서 현재 사용자 수 가져오기
      const participantCount = room.participant ? room.participant.size : 0; // 참가자 수 계산 (participant의 키 개수)

      return {
        ...room.toObject(), // 기존 Room 객체의 데이터를 그대로 복사
        memberCount: currentUserCount, // memberCount를 usersNumber의 값으로 대체
        participantCount, // 참가자 수
      };
    });

    console.log("방 목록 응답:", updatedRooms);
    res.status(200).json(updatedRooms); // 태그 포함된 방 목록 응답
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
    // Room 데이터 가져오기
    const room = await Room.findOne({ roomNumber: roomId }).select(
      "roomNumber roomname createdby tags participant"
    );

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // 방 생성자의 프로필 이미지 가져오기
    const creator = await user.findOne({ username: room.createdby }).select("profileImageUrl"); // `user`로 변경
    const creatorProfileImage = creator?.profileImageUrl || "/default-profile.png"; // 기본 프로필 이미지

    // 응답 데이터 조합
    const roomWithDetails = {
      roomname: room.roomname,
      memberCount: usersNumber[roomId] + 1 || 0, // 시청자 수
      createdby: room.createdby, // 생성자 이름
      creatorProfileImage, // 생성자의 프로필 이미지
      tags: room.tags || [], // 태그
    };

    res.status(200).json(roomWithDetails);
  } catch (error) {
    console.error("방 정보 가져오기 실패:", error.message);
    res.status(500).json({ error: "방 정보를 가져오는 중 오류가 발생했습니다." });
  }
});







module.exports = router;

