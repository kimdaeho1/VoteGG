import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import './VoteStatistic.css'; // 스타일 시트 임포트

const VoteStatistichard = () => {

  // 하드코딩된 데이터
  const chartDataTeam = [
    { name: 'Red 팀', y: 5 },
    { name: 'Blue 팀', y: 7 },
  ];

  const chartDataParticipants = [
    { name: '참가자 1', y: 2 },
    { name: '참가자 2', y: 3 },
    { name: '참가자 3', y: 4 },
    { name: '참가자 4', y: 5 },
  ];
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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

  return (
    <div className="modal-overlay">
      <div className="modal-content1">
        <h2 className="modal-title">참가자 및 팀 득표 결과</h2>
        <div className="chart-container">
          <HighchartsReact highcharts={Highcharts} options={teamChartOptions} />
        </div>
        <div className="chart-container">
          <HighchartsReact highcharts={Highcharts} options={participantChartOptions} />
        </div>
        <button className="close-button1" onClick={closeModal}>
          닫기
        </button>
      </div>
    </div>
  );
};

export default VoteStatistichard;

