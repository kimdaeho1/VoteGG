import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "./TagHistoryModal.css";

const TagHistoryModal = ({ isOpen, onClose, roomData }) => {
  const [debateResult, setDebateResult] = useState(null); // DebateResult 데이터를 저장
  console.log("DebateResult State:", debateResult);

  useEffect(() => {
    // API 호출로 DebateResult 가져오기
    const fetchDebateResult = async () => {
      if (roomData && roomData.roomName) {
        try {
          // roomName 인코딩 처리
          const encodedRoomName = encodeURIComponent(roomData.roomName);
          const response = await fetch(`/api/debate-result/${encodedRoomName}`);
          if (!response.ok) {
            throw new Error("DebateResult 데이터를 가져오는데 실패했습니다.");
          }
          const data = await response.json();
          
          setDebateResult(data[0]); // 첫 번째 결과만 사용
        } catch (error) {
          console.error("DebateResult 데이터 가져오기 오류:", error);
        }
      }
    };

    fetchDebateResult();
  }, [roomData]);

  if (!isOpen || !roomData) return null;

  // DebateResult 데이터가 없을 경우 로딩 메시지
  if (!debateResult) {
    return ReactDOM.createPortal(
      <div className="tag-history-modal-overlay">
        <div className="tag-history-modal-content">
          <button className="tag-history-modal-close" onClick={onClose}>
            &times;
          </button>
          <p>Loading...</p>
        </div>
      </div>,
      document.getElementById("modal-root")
    );
  }

  // `debateResult` 데이터 처리
  const participantsArray = debateResult.participantsArray || [];
  console.log("participantsArray:", participantsArray);

  const leftArgument = debateResult.leftArgument?.[0]?.[1] || "No argument provided";
  const rightArgument = debateResult.rightArgument?.[0]?.[1] || "No argument provided";

  const categories = participantsArray.map(([name]) => name);
  const data = participantsArray.map(([_, votes]) => Number(votes) || 0); // 숫자로 변환하여 득표수 설정

  // 하이차트 옵션 구성
  const chartOptions = {
    chart: {
      type: "bar",
    },
    title: {
      text: "Participants Votes",
    },
    xAxis: {
      categories: categories,
      title: {
        text: null,
      },
    },
    yAxis: {
      title: {
        text: "Votes",
      },
      labels: {
        formatter: function () {
          return this.value; // 양수 그대로 표시
        },
      },
    },
    plotOptions: {
      series: {
        dataLabels: {
          enabled: true,
        },
      },
    },
    series: [
      {
        name: "Votes",
        data: data,
      },
    ],
    credits: {
      enabled: false,
    },
    accessibility: {
      enabled: false, // 접근성 모듈 비활성화 (경고 메시지 제거용)
    },
  };

  return ReactDOM.createPortal(
    <div className="tag-history-modal-overlay">
      <div className="tag-history-modal-content">
        <button className="tag-history-modal-close" onClick={onClose}>
          &times;
        </button>
        <div>
          <h2>{debateResult.roomName}</h2>
          <h4>토론 결과</h4>
          <p>총 토론 시청자: {debateResult.maxViewers}명</p>
          <div>
            <strong>토론자:</strong>
            <p>
              {categories[0]} (Left) vs {categories[1] || "N/A"} (Right)
            </p>
          </div>
          <div>
            <strong>양측 주장:</strong>
            <p>
              {categories[0]}: {leftArgument}
            </p>
            <p>
              {categories[1] || "N/A"}: {rightArgument}
            </p>
          </div>
          <div className="tag-history-chart-container">
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          </div>
          <p>
            <strong>관련 태그:</strong> {debateResult.tags.join(", ")}
          </p>
          <button className="tag-history-modal-close-btn" onClick={onClose}>
            모달 닫기
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default TagHistoryModal;

