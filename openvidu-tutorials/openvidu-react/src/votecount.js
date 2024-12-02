// voteCount.js

import axios from "axios";

// 로컬스토리지에서 최대 투표권과 사용된 투표권 가져오기
const getVoteCount = (roomNumber, userId) => {
  const votes = JSON.parse(localStorage.getItem("votes")) || {};

  if (!votes[roomNumber]) {
    votes[roomNumber] = {};
  }
  if (!votes[roomNumber][userId]) {
    votes[roomNumber][userId] = {
      maxVoteCount: 0,  // 최대 투표권 (초기값 0)
      usedVoteCount: 0  // 사용된 투표권 (초기값 0)
    };
  }

  return {
    maxVoteCount: votes[roomNumber][userId].maxVoteCount,
    usedVoteCount: Number(votes[roomNumber][userId].usedVoteCount)  // 문자열을 숫자로 변환하여 반환
  };
};

// 최대 투표권 증가 (10초마다 1개씩 증가, 최대 10개까지)
const increaseVoteCount = (roomNumber, userId) => {
  const votes = JSON.parse(localStorage.getItem("votes")) || {};

  if (!votes[roomNumber]) {
    votes[roomNumber] = {};
  }
  if (!votes[roomNumber][userId]) {
    votes[roomNumber][userId] = {
      maxVoteCount: 0,
      usedVoteCount: 0
    };
  }

  if (votes[roomNumber][userId].maxVoteCount < 10) {
    votes[roomNumber][userId].maxVoteCount += 1;
    localStorage.setItem("votes", JSON.stringify(votes));  // 로컬스토리지에 저장
  }
};

// 투표권 사용
const useVoteCount = (roomNumber, userId, voteCountToUse) => {
  const votes = JSON.parse(localStorage.getItem("votes")) || {};

  if (!votes[roomNumber]) {
    votes[roomNumber] = {};
  }
  if (!votes[roomNumber][userId]) {
    votes[roomNumber][userId] = {
      maxVoteCount: 0,
      usedVoteCount: 0
    };
  }

  const currentUsedVoteCount = Number(votes[roomNumber][userId].usedVoteCount);
  const currentMaxVoteCount = Number(votes[roomNumber][userId].maxVoteCount);

  if (voteCountToUse <= 0 || voteCountToUse > (currentMaxVoteCount - currentUsedVoteCount)) {
    console.error("투표권을 올바르게 사용해주세요.");
    return false;
  }

  // 사용된 투표권을 숫자로 처리하여 업데이트
  votes[roomNumber][userId].usedVoteCount = currentUsedVoteCount + voteCountToUse;
  localStorage.setItem("votes", JSON.stringify(votes));  // 로컬스토리지에 저장
  return true;
};

// 투표 처리 함수
const handleVote = async (roomNumber, userId, selectedParticipant, currentVote, remainingVoteCount, addToast) => {
  if (typeof addToast !== "function") {
    console.error("addToast는 유효한 함수가 아닙니다.");
    return remainingVoteCount;
  }
  // 투표권 사용
  const voteSuccess = useVoteCount(roomNumber, userId, Math.abs(currentVote));

  if (voteSuccess) {
    try {
      await axios.post("/api/room/vote", {
        roomNumber,
        participant: selectedParticipant,
        votes: parseInt(currentVote, 10),
      });

      addToast(`${selectedParticipant}님에게 ${currentVote} 투표 완료!`, 'success');

      // 투표 후 투표권을 새로 가져오기
      const updatedVoteCount = getVoteCount(roomNumber, userId);
      const updatedRemainingVoteCount = updatedVoteCount.maxVoteCount - updatedVoteCount.usedVoteCount;
      return updatedRemainingVoteCount; // 투표 후 남은 투표권을 반환
    } catch (error) {
      console.error("투표 실패:", error.message);
      addToast("투표 중 오류가 발생했습니다.", "error");
      return remainingVoteCount; // 실패한 경우 원래의 remainingVoteCount 반환
    }
  } else {
    return remainingVoteCount; // 투표권 사용 실패 시 원래의 remainingVoteCount 반환
  }
};

export { getVoteCount, increaseVoteCount, useVoteCount, handleVote };
