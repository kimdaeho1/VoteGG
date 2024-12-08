

import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './VoteStatistichard.css';

const VoteStatistichard = ({ onClose }) => {


  const chartDataParticipants = [
    { name: '키보드워리어', y: 24 },
    { name: '고구마킬러', y: 35 },
  
  ];

  const maxParticipant = chartDataParticipants.reduce((max, participant) => {
    return participant && participant.y > (max?.y || 0) ? participant : max;
  }, {});

  const participantChartOptions = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
    },
    title: {
      text: null, // 중앙 타이틀 제거
    },
    colors: ['#FFD700', '#4D96FF', '#FFC75F', '#F9F871', '#FF8C42', '#845EC2'],
    credits: {
      enabled: false,
    },
    tooltip: {
      pointFormat: '<span style="font-size: 16px; font-weight: bold; color: #000000;">{series.name}</span>: <b>{point.y}</b>', // 글자색을 검은색으로 변경
    },
    plotOptions: {
      pie: {
        allowPointSelect: false, // 클릭 반응 제거
        innerSize: '50%',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}',
          style: { 
            fontSize: '16px', 
            color: '#1a237e', // 진한 파란색으로 변경
            textOutline: 'none', 
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)' 
          },
        },
        showInLegend: true,
      },
    },
    legend: {
      itemStyle: {
        fontSize: '20px', // 글씨 크기를 키우기
        color: '#1a237e', // 진한 파란색
        fontWeight: 'bold',
      },
      symbolHeight: 14, // 아이콘 크기 조정
      symbolRadius: 6, // 아이콘 둥글게
    },
    series: [
      {
        name: '득표수',
        colorByPoint: true,
        data: chartDataParticipants,
      },
    ],
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleOverlayClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content1 animated-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">참가자 득표 결과</h2>
        {maxParticipant.name && (
          <div className="winner-banner">이긴 사람: <strong>{maxParticipant.name}</strong></div>
        )}
        <div className="chart-container">
          <HighchartsReact highcharts={Highcharts} options={participantChartOptions} />
        </div>
        <button onClick={handleClose} className="close-button1">닫기</button>
      </div>
    </div>
  );
};

export default VoteStatistichard;