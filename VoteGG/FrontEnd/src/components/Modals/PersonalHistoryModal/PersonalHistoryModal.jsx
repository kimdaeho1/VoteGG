import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import jwt_decode from "jwt-decode";
import "./PersonalHistoryModal.css";

const FILTERS = {
  ONE_DAY: "1일",
  THREE_DAYS: "3일",
  ONE_WEEK: "1주일",
  ALL: "전체",
};

const PersonalHistory = ({ onClose }) => {
  const [historyResults, setHistoryResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [username, setUsername] = useState("");

  const applyFilter = (filter, results) => {
    const now = new Date();
  
    switch (filter) {
      case FILTERS.ONE_DAY: {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 1);
        return results.filter((item) => new Date(item.createdAt) >= cutoff);
      }
      case FILTERS.THREE_DAYS: {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 3);
        return results.filter((item) => new Date(item.createdAt) >= cutoff);
      }
      case FILTERS.ONE_WEEK: {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        return results.filter((item) => new Date(item.createdAt) >= cutoff);
      }
      case FILTERS.ALL:
      default:
        return results;
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("로그인이 필요합니다.");
          setLoading(false);
          return;
        }

        const payload = jwt_decode(token);
        setUsername(payload.username);
        const myHistory = payload.myHistory || [];
        const roomNames = myHistory.map((entry) => entry.roomName);
        const uniqueRoomNames = [...new Set(roomNames)];

        const allResults = [];
        for (const name of uniqueRoomNames) {
          const res = await fetch(`/api/debate-result/${name}`);
          if (!res.ok) {
            console.error(`${name}의 데이터 가져오기 실패`);
            continue;
          }
          const data = await res.json();
          allResults.push(...data);
        }

        // 최신 순으로 정렬
        allResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistoryResults(allResults);
        setFilteredResults(applyFilter(filter, allResults));
      } catch (err) {
        console.error("히스토리 가져오는 중 오류:", err);
        setError("데이터를 가져오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    setFilteredResults(applyFilter(filter, historyResults));
  }, [filter, historyResults]);

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} ${
      d.getHours() < 10 ? "0" : ""
    }${d.getHours()}:${d.getMinutes() < 10 ? "0" : ""}${d.getMinutes()}`;
  };

  const handleDelete = async (roomName) => {
    let token = localStorage.getItem("token");

    const refreshToken = async () => {
      try {
        const res = await fetch(`/api/user/refresh-token`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("token", data.token); // 새 JWT 저장
          return data.token;
        } else {
          console.error("토큰 갱신 실패");
          return null;
        }
      } catch (err) {
        console.error("토큰 갱신 중 오류:", err);
        return null;
      }
    };

    try {
      const res = await fetch(`/api/debate-result/history`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomName }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token); // 새 JWT 저장
        const newHistory = historyResults.filter((item) => item.roomName !== roomName);
        setHistoryResults(newHistory);
        setFilteredResults(applyFilter(filter, newHistory));
      } else if (res.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          token = newToken;
          handleDelete(roomName); // 재시도
        }
      } else {
        console.error("히스토리 삭제 실패");
      }
    } catch (err) {
      console.error("히스토리 삭제 중 오류:", err);
    }
  };

  return ReactDOM.createPortal(
    <div className="personal-history-modal-overlay">
      <div className="personal-history-modal-content">
        <h2 className="history-title">{username}님의 토론참가기록</h2>
        <button onClick={onClose} className="close-button">
          닫기
        </button>
        <div className="filter-buttons">
          {Object.values(FILTERS).map((f) => (
            <button
              key={f}
              className={`filter-button ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        {loading && <p>로딩 중...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && filteredResults.length === 0 && (
          <p>토론 기록이 없습니다.</p>
        )}
        {!loading && !error && filteredResults.length > 0 && (
          <div className="history-slider-wrapper">
            <div className="history-slider">
              {filteredResults.map((result, index) => (
                <div className="history-card" key={index}>
                  <div className="card-header">
                    <h3 className="history-roomName">제목: {result.roomName}</h3>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(result.roomName)}
                    >
                      &times;
                    </button>
                  </div>
                  <p>
                    참가자:{" "}
                    {result.participantsArray[0]?.[0] || "Unknown"} vs{" "}
                    {result.participantsArray[1]?.[0] || "Unknown"}
                  </p>
                  <p>
                    득표수: {result.participantsArray[0]?.[1] || 0} vs{" "}
                    {result.participantsArray[1]?.[1] || 0}
                  </p>
                  <p>
                    {result.participantsArray[0]?.[0] || "Unknown"}의 주장:{" "}
                    {result.leftArgument?.[0]?.[1] || "없음"}
                  </p>
                  <p>
                    {result.participantsArray[1]?.[0] || "Unknown"}의 주장:{" "}
                    {result.rightArgument?.[0]?.[1] || "없음"}
                  </p>
                  <p>최대 시청자: {result.maxViewers}명</p>
                  <p>토론 일자: {formatDate(result.createdAt)}</p>
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
