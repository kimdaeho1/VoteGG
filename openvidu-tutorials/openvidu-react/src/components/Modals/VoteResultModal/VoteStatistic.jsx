// src/components/Modals/VoteResultModal/VoteStatistic.jsx
import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './VoteStatistic.css'; // 스타일 시트 임포트

const VoteStatistic = ({ onClose }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const roomNumber = window.location.pathname.split('/').pop();

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/room/${roomNumber}/participants`);
        const participants = response.data;

        const data = participants.map(([id, votes]) => ({
          name: id,
          y: votes,
        }));

        setChartData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching participants:', error);
        setError('참가자 목록을 가져오는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [roomNumber]);

  const options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      style: {
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      },
    },
    colors: ['#FF6B6B', '#6BCB77', '#4D96FF', '#FFC75F', '#F9F871', '#FF8C42', '#8D93AB', '#845EC2'],
    title: {
      text: null,
    },
    credits: {
      enabled: false,
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.y}</b>',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      style: {
        color: '#FFFFFF',
      },
    },
    plotOptions: {
      pie: {
        innerSize: '50%',
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          style: { fontSize: '16px', color: '#333333', textOutline: 'none' },
          format: '<b>{point.name}</b>: {point.y}',
        },
        showInLegend: true,
        borderColor: '#ffffff',
        borderWidth: 2,
        shadow: {
          color: 'rgba(0, 0, 0, 0.3)',
          width: 5,
          offsetX: 0,
          offsetY: 0,
        },
      },
    },
    legend: {
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal',
      itemStyle: {
        fontSize: '16px',
        color: '#333333',
      },
    },
    series: [
      {
        name: '득표수',
        colorByPoint: true,
        data: chartData,
      },
    ],
  };

  if (isLoading) {
    return <div className="loading-message">로딩 중...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const handleClose = () => {
    navigate('/');
  };

  const handleOverlayClick = () => {
    navigate('/');
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content1" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">결과 확인</h2>
        <p className="modal-subtitle">참가자들의 득표 결과를 확인하세요.</p>
        <HighchartsReact highcharts={Highcharts} options={options} />
        <button onClick={handleClose} className="close-button1">
          닫기
        </button>
      </div>
    </div>
  );
};

export default VoteStatistic;
