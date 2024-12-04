// src/components/Modals/VoteResultModal/VoteStatistic.jsx

import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './VoteStatistic.css'; // 스타일 시트 임포트

const VoteStatistic = ({ onClose, resultData }) => {
  const [chartDataTeam, setChartDataTeam] = useState([]);
  const [chartDataParticipants, setChartDataParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const roomNumber = window.location.pathname.split('/').pop();

  // resultData를 기반으로 팀별 차트 데이터 설정
  useEffect(() => {
    console.log("VoteStatistic에서 수신한 resultData:", resultData);
    if (resultData) {
      const teamData = [
        { name: 'Red 팀', y: resultData.redScore || 0 },
        { name: 'Blue 팀', y: resultData.blueScore || 0 },
      ];
      setChartDataTeam(teamData);
    } else {
      // resultData가 없을 때 기본값 설정
      const teamData = [
        { name: 'Red 팀', y: 0 },
        { name: 'Blue 팀', y: 0 },
      ];
      setChartDataTeam(teamData);
    }
    setIsLoading(false); // 로딩 상태 해제
  }, [resultData]);

  // 참가자별 데이터를 fetch하여 차트 데이터 설정
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await axios.get(`/api/room/${roomNumber}/participants`);
        const participants = response.data;

        const participantData = participants.map(([id, votes]) => ({
          name: id,
          y: votes,
        }));

        setChartDataParticipants(participantData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching participants:', error);
        setError('참가자 목록을 가져오는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [roomNumber]);

  // 가장 득표수가 많은 참가자 찾기
  const maxParticipant = chartDataParticipants.reduce((max, participant) => {
    return participant.y > max.y ? participant : max;
  }, chartDataParticipants[0]);

  const teamChartOptions = {
    chart: {
      type: 'bar', // 가로 막대 차트
      backgroundColor: 'transparent',
      height: 150, // 차트 높이 설정
    },
    title: {
      text: null,
    },
    credits: {
      enabled: false,
    },
    xAxis: {
      categories: ['투표 결과'], // X축에 하나의 범주만 설정
      title: {
        text: null,
      },
      labels: {
        enabled: false, // X축 레이블을 숨김
      },
      lineWidth: 0, // X축 선 제거
      tickWidth: 0, // 틱 마크 제거
    },
    yAxis: {
      visible: false, // Y축 숨김
      min: -10, // 음수와 양수 값의 균형을 위해 설정
      max: 10,
    },
    plotOptions: {
      series: {
        stacking: 'normal', // 스택 설정
        borderWidth: 0, // 막대 테두리 제거
      },
      bar: {
        dataLabels: {
          enabled: true, // 데이터 레이블 사용
          formatter: function () {
            return Math.abs(this.y); // 득표 수를 데이터 레이블로 표시
          },
          style: {
            fontSize: '14px',
            color: '#333333', // 레이블 색상
            textOutline: 'none',
            fontWeight: 'bold',
          },
          align: 'center', // 막대 중앙에 텍스트 위치
          inside: true, // 막대 내부 중앙에 표시
        },
        pointWidth: 30, // 막대 두께 설정
      },
    },
    tooltip: {
      enabled: false, // 툴팁 숨김
    },
    legend: {
      enabled: true, // 범례 활성화하여 각 팀 표시
      align: 'center',
      verticalAlign: 'bottom',
      itemStyle: {
        fontSize: '14px',
        color: '#333333',
      },
    },
    series: [
      {
        name: 'Red 팀',
        data: [-chartDataTeam[0]?.y || 0], // 음수로 설정하여 왼쪽에 표시
        color: '#FF6B6B',
      },
      {
        name: 'Blue 팀',
        data: [chartDataTeam[1]?.y || 0], // 양수로 설정하여 오른쪽에 표시
        color: '#4D96FF',
      },
    ],
  };

  // 참가자별 차트 옵션: 도넛 모양
  const participantChartOptions = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
    },
    title: {
      text: maxParticipant ? `최다 득표<br>${maxParticipant.name}` : null,
      verticalAlign: 'middle',
      floating: true,
      style: {
        fontSize: '18px',
        color: '#333333',
        textOutline: 'none',
        fontWeight: 'bold',
      },
    },
    colors: ['#4D96FF', '#FFC75F', '#F9F871', '#FF8C42', '#845EC2'],
    credits: {
      enabled: false,
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.y}</b>',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        innerSize: '50%', // 도넛 모양으로 설정
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}',
          style: { fontSize: '16px', color: '#333333', textOutline: 'none' },
        },
      },
    },
    series: [
      {
        name: '득표수',
        colorByPoint: true,
        data: chartDataParticipants,
      },
    ],
  };

  if (isLoading || chartDataTeam.length < 2) {
    return <div className="loading-message">로딩 중......</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const handleClose = () => {
    navigate('/');
    if (onClose) onClose();
  };

  const handleOverlayClick = () => {
    navigate('/');
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content1" onClick={(e) => e.stopPropagation()}>
       <h2 className="modal-title">참가자 및 팀 득표 결과</h2>
        <div className="chart-container">
          <HighchartsReact highcharts={Highcharts} options={teamChartOptions} />
        </div>
        <div className="chart-container">
          <HighchartsReact highcharts={Highcharts} options={participantChartOptions} />
        </div>
        <button onClick={handleClose} className="close-button1">
          닫기
        </button>
      </div>
    </div>
  );
};

export default VoteStatistic;
