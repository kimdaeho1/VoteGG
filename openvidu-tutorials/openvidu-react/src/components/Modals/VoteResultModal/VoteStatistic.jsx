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
    },
    colors: ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'],
    title: {
      text: null,
    },
    credits: {
      enabled: false,
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.y}</b>',
    },
    plotOptions: {
      pie: {
        innerSize: '60%',
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          style: { fontSize: '14px', color: '#333333' },
          format: '{point.name}: {point.y}',
        },
        showInLegend: true,
      },
    },
    legend: {
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal',
      itemStyle: {
        fontSize: '14px',
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">결과 확인</h2>
        <p className="modal-subtitle">참가자들의 득표 결과를 확인하세요.</p>
        <HighchartsReact highcharts={Highcharts} options={options} />
        <button onClick={handleClose} className="close-button">
          닫기
        </button>
      </div>
    </div>
  );
};

export default VoteStatistic;
