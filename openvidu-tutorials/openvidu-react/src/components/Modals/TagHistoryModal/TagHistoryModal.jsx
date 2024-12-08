import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "./TagHistoryModal.css";

const TagHistoryModal = ({ isOpen, onClose, roomData }) => {
  useEffect(() => {
    console.log("TagHistoryModal received roomData:", roomData);
  }, [roomData]);

  if (!isOpen) return null;

  // 하이차트 옵션 구성
  const chartOptions = {
    chart: {
      type: "bar",
    },
    title: {
      text: "Participants Votes",
    },
    xAxis: {
      categories: roomData.participantsArray.map(([name]) => name),
      title: {
        text: null,
      },
    },
    yAxis: {
      min: -Math.max(...roomData.participantsArray.map(([_, value]) => Math.abs(parseInt(value)))),
      max: Math.max(...roomData.participantsArray.map(([_, value]) => Math.abs(parseInt(value)))),
      title: {
        text: "Votes",
        align: "high",
      },
      labels: {
        overflow: "justify",
      },
    },
    plotOptions: {
      series: {
        stacking: "normal",
        dataLabels: {
          enabled: true,
        },
      },
    },
    series: [
      {
        name: "Votes",
        data: roomData.participantsArray.map(([_, value]) => value),
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return ReactDOM.createPortal(
    <div className="tag-history-modal-overlay">
      <div className="tag-history-modal-content">
        <button className="tag-history-modal-close" onClick={onClose}>
          &times;
        </button>
        {roomData ? (
          <div>
            <h2>{roomData.roomName}</h2>
            <h4>토론 결과</h4>
            <p>총 토론 시청자 : {roomData.maxViewers}명</p>
            <p>
              {roomData.participantsArray[0][0]} 대 {roomData.participantsArray[1]?.[0] || "N/A"}
            </p>
            <div className="tag-history-chart-container">
              <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            </div>
            <p>
              <strong>관련 태그:</strong> {roomData.tags.join(", ")}
            </p>
            <button className="tag-history-modal-close-btn" onClick={onClose}>
              모달 닫기
            </button>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>,
    document.getElementById("modal-root") // 모달을 최상단에 렌더링
  );
};

export default TagHistoryModal;
