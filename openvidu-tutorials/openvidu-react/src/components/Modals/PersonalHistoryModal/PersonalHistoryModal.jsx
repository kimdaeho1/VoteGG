import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./PersonalHistoryModal.css";

const PersonalHistory = ({ onClose }) => {
  const [historyResults, setHistoryResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("로그인이 필요합니다.");
          setLoading(false);
          return;
        }

        const payload = JSON.parse(atob(token.split(".")[1]));
        const myHistory = payload.myHistory || [];

        // roomName 목록 추출
        const roomNames = myHistory.map(entry => entry.roomName);

        // 중복 roomName 제거(옵션)
        const uniqueRoomNames = [...new Set(roomNames)];

        // 모든 roomName에 대해 결과 가져오기
        const allResults = [];
        for (const name of uniqueRoomNames) {
          const res = await fetch(`/api/debate-result/${name}`);
          if (!res.ok) {
            console.error(`${name}의 데이터 가져오기 실패`);
            continue;
          }
          const data = await res.json();
          // data가 배열 형태라고 가정. 여러 결과가 있을 수 있으므로 allResults에 push
          allResults.push(...data);
        }

        setHistoryResults(allResults);
      } catch (err) {
        console.error("히스토리 가져오는 중 오류:", err);
        setError("데이터를 가져오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return ReactDOM.createPortal(
    <div className="personal-history-modal-overlay">
      <div className="personal-history-modal-content">
        <h2 className="history-title">나의 토론참가기록</h2>
        <button onClick={onClose} className="close-button">
          닫기
        </button>
        {loading && <p>로딩 중...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && historyResults.length === 0 && (
          <p>토론 기록이 없습니다.</p>
        )}
        {!loading && !error && historyResults.length > 0 && (
          <div className="history-slider-wrapper">
            <div className="history-slider">
              {historyResults.map((result, index) => (
                <div className="history-card" key={index}>
                  <h3 className="history-roomName">{result.roomName}</h3>
                  <p>Tags: {result.tags?.join(", ") || "없음"}</p>
                  <p>Participants: {result.participantsArray?.length || 0}명</p>
                  <p>Max Viewers: {result.maxViewers || 0}</p>
                  <p>Red Score: {result.redScore || 0}</p>
                  <p>Blue Score: {result.blueScore || 0}</p>
                  <p>Created At: {new Date(result.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default PersonalHistory;

