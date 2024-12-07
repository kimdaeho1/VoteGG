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
      // 태그별로 가장 많이 사용된 태그를 추출
      const tagCounts = await DebateResult.aggregate([
        { $unwind: "$tags" }, // tags 배열을 펼침
        { $group: { _id: "$tags", count: { $sum: 1 } } }, // 태그별 개수 계산
        { $sort: { count: -1 } }, // 개수 기준 내림차순 정렬
        { $limit: 4 }, // 상위 4개의 태그만 추출
      ]);
  
      const popularTags = tagCounts.map((tag) => tag._id);
  
      // 각 태그에 대해 인기 있는 토론 5개 가져오기
      const popularDebates = {};
      for (const tag of popularTags) {
        const debates = await DebateResult.find({ tags: tag })
          .sort({ maxViewers: -1 }) // 시청자 수 기준 내림차순 정렬
          .limit(5)
          .select("roomName maxViewers tags");
        popularDebates[tag] = debates;
      }
  
      res.status(200).json({ popularTags, popularDebates });
    } catch (error) {
      console.error("Error fetching popular topics:", error);
      res.status(500).json({ message: "Failed to fetch popular topics" });
    }
  });

module.exports = router;
