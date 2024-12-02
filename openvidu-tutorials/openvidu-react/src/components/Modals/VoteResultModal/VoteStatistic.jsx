import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
    },
    title: {
      text: '참가자 득표 현황',
      style: { fontSize: '20px', fontWeight: 'bold' },
    },
    plotOptions: {
      pie: {
        innerSize: '50%',
        dataLabels: {
          enabled: true,
          style: { fontSize: '14px', color: '#333' },
          format: '{point.name}: {point.y}',
        },
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">결과 확인</h2>
        <p className="modal-subtitle">참가자들의 득표 결과를 확인하세요.</p>
        <HighchartsReact highcharts={Highcharts} options={options} />
        <button onClick={handleClose} className="close-button">닫기</button>
      </div>
    </div>
  );
};

export default VoteStatistic;
