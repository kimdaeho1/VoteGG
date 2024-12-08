const express = require("express");
const router = express.Router();
const DebateResult = require("../schemas/debateResult");

// 토론 결과 저장
// router.post("/save-result", async (req, res) => {
//   const { roomName, tags, redScore, blueScore, maxViewers } = req.body;

//   try {
//     const newResult = new DebateResult({
//       roomName,
//       tags,
//       redScore,
//       blueScore,
//       maxViewers,
//     });
//     await newResult.save();
//     res.status(200).json({ message: "Debate result saved successfully" });
//   } catch (error) {
//     console.error("Error saving debate result:", error);
//     res.status(500).json({ message: "Failed to save debate result" });
//   }
// });

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



module.exports = router;

