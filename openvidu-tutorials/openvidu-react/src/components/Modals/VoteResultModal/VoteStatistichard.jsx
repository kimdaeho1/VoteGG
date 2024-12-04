import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import './VoteStatistichard.css'; // 스타일 시트 임포트

const VoteStatistichard = () => {

  // 하드코딩된 데이터
  const chartDataTeam = [
    { name: 'Red 팀', y: 5 },
    { name: 'Blue 팀', y: 7 },
  ];

  const chartDataParticipants = [
    { name: '키보드워리어', y: 2 },
    { name: '고구마킬러', y: 3 },
    { name: '탕수육찍먹파', y: 4 },
    { name: '반민초혁명군', y: 5 },
  ];

  const [isModalOpen, setIsModalOpen] = useState(true);

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

  // 가장 득표수가 많은 팀 찾기
  const winningTeam = chartDataTeam.reduce((max, team) => {
    return team.y > max.y ? team : max;
  }, chartDataTeam[0]);

  // 이긴 팀의 색상 결정
  const winningTeamColor = winningTeam.name.includes('Red') ? '#FF6B6B' : '#4D96FF';

  const teamChartOptions = {
    chart: {
      type: 'bar',
      backgroundColor: 'transparent',
      height: 150,
    },
    title: {
      text: null,
    },
    credits: {
      enabled: false,
    },
    xAxis: {
      categories: ['투표 결과'],
      title: {
        text: null,
      },
      labels: {
        enabled: false,
      },
      lineWidth: 0,
      tickWidth: 0,
    },
    yAxis: {
      visible: false,
      min: -10,
      max: 10,
    },
    plotOptions: {
      series: {
        stacking: 'normal',
        borderWidth: 0,
      },
      bar: {
        dataLabels: {
          enabled: true,
          formatter: function () {
            return Math.abs(this.y);
          },
          style: {
            fontSize: '14px',
            color: '#333333',
            textOutline: 'none',
            fontWeight: 'bold',
          },
          align: 'center',
          inside: true,
        },
        pointWidth: 30,
      },
    },
    tooltip: {
      enabled: false,
    },
    legend: {
      enabled: true,
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
        data: [-chartDataTeam[0]?.y || 0],
        color: '#FF6B6B',
      },
      {
        name: 'Blue 팀',
        data: [chartDataTeam[1]?.y || 0],
        color: '#4D96FF',
      },
    ],
  };

  const participantChartOptions = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
    },
    title: {
      text: maxParticipant
        ? `<div style="text-align: center;">최다 득표자<br><span style="font-size: 22px; color: #4D96FF;">${maxParticipant.name}</span></div>`
        : null,
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
        innerSize: '50%',
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
    isModalOpen && (
      <div className="modal-overlay">
        <div className="modal-content1">
          <h2 className="modal-title">참가자 및 팀 득표 결과</h2>
          <div className="winning-team">
            <h3
              className="winning-team-title"
              style={{ color: winningTeamColor }}
            >
              이긴 팀은{' '}
              <span className="winning-team-name">{winningTeam.name}</span>
              입니다!
            </h3>
          </div>
          <div className="chart-container">
            <HighchartsReact
              highcharts={Highcharts}
              options={teamChartOptions}
            />
          </div>
          <div className="chart-container">
            <HighchartsReact
              highcharts={Highcharts}
              options={participantChartOptions}
            />
          </div>
          <button className="close-button1" onClick={closeModal}>
            닫기
          </button>
        </div>
      </div>
    )
  );
};

export default VoteStatistichard;