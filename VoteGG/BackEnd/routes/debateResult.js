const express = require("express");
const router = express.Router();
const DebateResult = require("../schemas/debateResult");
const user = require("../schemas/user"); // 'User' 모델 추가
const jwt = require("jsonwebtoken"); // 추가

// 인기 태그와 인기 토론 가져오기
router.get("/popular-topics", async (req, res) => {
  try {
    const tagCounts = await DebateResult.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 },
    ]);

    const popularTags = tagCounts.map((tag) => tag._id);

    const popularDebates = {};
    for (const tag of popularTags) {
      const debates = await DebateResult.find({ tags: tag })
        .sort({ maxViewers: -1 })
        .limit(5)
        .select("roomName maxViewers tags participantsArray createdAt");
      popularDebates[tag] = debates;
    }

    res.status(200).json({ popularTags, popularDebates });
  } catch (error) {
    console.error("Error fetching popular topics:", error);
    res.status(500).json({ message: "Failed to fetch popular topics" });
  }
});

// roomName 기준으로 DebateResult 조회 API
router.get("/:roomName", async (req, res) => {
  const { roomName } = req.params;
  console.log("roomName:", roomName);
  console.log("api탓따");
  try {
    const results = await DebateResult.find({ roomName }); // roomName 기준으로 검색
    if (!results.length) {
      return res.status(404).json({ message: "해당 roomName의 결과를 찾을 수 없습니다." });
    }
    res.json(results);
  } catch (error) {
    console.error("DebateResult 조회 중 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 유저 히스토리에서 특정 기록 삭제 및 JWT 토큰 재발급
router.delete("/history", async (req, res) => {
  const { roomName } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "JWT 토큰이 필요합니다." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const currentUser = await user.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 히스토리에서 roomName 제거
    currentUser.myHistory = currentUser.myHistory.filter(
      (entry) => entry.roomName !== roomName
    );

    // MongoDB에 업데이트
    await currentUser.save();

    // 새로운 JWT 발급
    const newToken = jwt.sign(
      {
        userId: currentUser._id,
        username: currentUser.username,
        profileImageUrl: currentUser.profileImageUrl || "",
        totalParticipations: currentUser.totalParticipations || 0,
        totalWins: currentUser.totalWins || 0,
        firstPlaceWins: currentUser.firstPlaceWins || 0,
        myHistory: currentUser.myHistory || [], // 업데이트된 히스토리 포함
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 새로운 토큰과 상태를 반환
    res.cookie("token", newToken, { httpOnly: false, secure: true });
    res.status(200).json({
      message: "히스토리가 삭제되었습니다.",
      token: newToken, // 새 JWT
    });
  } catch (error) {
    console.error("히스토리 삭제 중 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;

