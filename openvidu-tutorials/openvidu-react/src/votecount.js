// 로컬스토리지에서 최대 투표권과 사용된 투표권 가져오기
const getVoteCount = (roomNumber, userId) => {
    const votes = JSON.parse(localStorage.getItem("votes")) || {};
  
    // 해당 방과 사용자에 대한 투표권 정보가 없으면 초기화
    if (!votes[roomNumber]) {
      votes[roomNumber] = {};
    }
    if (!votes[roomNumber][userId]) {
      votes[roomNumber][userId] = {
        maxVoteCount: 0,  // 최대 투표권 (초기값 0)
        usedVoteCount: 0  // 사용된 투표권 (초기값 0)
      };
    }
  
    // 반환할 때 usedVoteCount를 숫자로 변환
    return {
      maxVoteCount: votes[roomNumber][userId].maxVoteCount,
      usedVoteCount: Number(votes[roomNumber][userId].usedVoteCount)  // 문자열을 숫자로 변환하여 반환
    };
  };
  
  // 최대 투표권 증가 (10초마다 1개씩 증가, 최대 10개까지)
  const increaseVoteCount = (roomNumber, userId) => {
    const votes = JSON.parse(localStorage.getItem("votes")) || {};
  
    // 해당 방과 사용자에 대한 투표권 정보가 없으면 초기화
    if (!votes[roomNumber]) {
      votes[roomNumber] = {};
    }
    if (!votes[roomNumber][userId]) {
      votes[roomNumber][userId] = {
        maxVoteCount: 0,
        usedVoteCount: 0
      };
    }
  
    // 최대 투표권이 10개 미만일 때만 증가
    if (votes[roomNumber][userId].maxVoteCount < 10) {
      votes[roomNumber][userId].maxVoteCount += 1;
      localStorage.setItem("votes", JSON.stringify(votes));  // 로컬스토리지에 저장
    }
  };
  
  // 투표권 사용
  const useVoteCount = (roomNumber, userId, voteCountToUse) => {
    const votes = JSON.parse(localStorage.getItem("votes")) || {};
  
    // 해당 방과 사용자에 대한 투표권 정보가 없으면 초기화
    if (!votes[roomNumber]) {
      votes[roomNumber] = {};
    }
    if (!votes[roomNumber][userId]) {
      votes[roomNumber][userId] = {
        maxVoteCount: 0,
        usedVoteCount: 0
      };
    }
  
    // 사용하려는 투표권이 최대 투표권을 초과하지 않도록 체크
    const currentUsedVoteCount = Number(votes[roomNumber][userId].usedVoteCount); // 숫자로 변환
    const currentMaxVoteCount = Number(votes[roomNumber][userId].maxVoteCount); // 숫자로 변환
  
    if (voteCountToUse <= 0 || voteCountToUse > (currentMaxVoteCount - currentUsedVoteCount)) {
      console.error("투표권을 올바르게 사용해주세요.");
      return false;
    }
  
    // 사용된 투표권을 숫자로 처리하여 업데이트
    votes[roomNumber][userId].usedVoteCount = currentUsedVoteCount + voteCountToUse; // 숫자로 계산하여 저장
    localStorage.setItem("votes", JSON.stringify(votes));  // 로컬스토리지에 저장
    return true;
  };
  
  export { getVoteCount, increaseVoteCount, useVoteCount };
  