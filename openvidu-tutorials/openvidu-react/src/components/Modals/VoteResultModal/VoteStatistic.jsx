import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './VoteStatistic.css';

const VoteStatistic = ({ onClose, resultData }) => {
  const [chartDataParticipants, setChartDataParticipants] = useState([]);
  const [winningArgument, setWinningArgument] = useState('');
  const [totalVotesLeft, setTotalVotesLeft] = useState(0);
  const [totalVotesRight, setTotalVotesRight] = useState(0);
  const [leftArgument, setLeftArgument] = useState('');
  const [rightArgument, setRightArgument] = useState('');
  const [leftUserId, setLeftUserId] = useState('');
  const [rightUserId, setRightUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const roomNumber = window.location.pathname.split('/').pop();

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await axios.get(`/api/room/${roomNumber}/participants`);
        const participants = response.data.participants || [];
        const LeftArgu = response.data.LeftArguMent?.[0]?.[1] || '';
        const RightArgu = response.data.RightArguMent?.[0]?.[1] || '';
        const LeftUserId = response.data.LeftArguMent?.[0]?.[0] || '';
        const RightUserId = response.data.RightArguMent?.[0]?.[0] || '';

        setLeftArgument(LeftArgu);
        setRightArgument(RightArgu);
        setLeftUserId(LeftUserId);
        setRightUserId(RightUserId);

        const participantData = participants.map(([id, votes]) => ({
          name: id,
          y: votes,
        }));
        setChartDataParticipants(participantData);
      } catch (error) {
        console.error('Error fetching participants:', error);
        setError('참가자 목록을 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [roomNumber]);

  useEffect(() => {
    console.log('Participants:', chartDataParticipants);
    if (chartDataParticipants.length > 0 && leftUserId && rightUserId) {
      const totalVotesLeftCalc = chartDataParticipants
        .filter((participant) => participant.name === leftUserId)
        .reduce((sum, participant) => sum + participant.y, 0);

      const totalVotesRightCalc = chartDataParticipants
        .filter((participant) => participant.name === rightUserId)
        .reduce((sum, participant) => sum + participant.y, 0);

      setTotalVotesLeft(totalVotesLeftCalc);
      setTotalVotesRight(totalVotesRightCalc);

      if (totalVotesLeftCalc > totalVotesRightCalc) {
        setWinningArgument(leftArgument);
      } else if (totalVotesRightCalc > totalVotesLeftCalc) {
        setWinningArgument(rightArgument);
      } else {
        setWinningArgument('양쪽 주장이 동점입니다.');
      }
    }
  }, [chartDataParticipants, leftUserId, rightUserId, leftArgument, rightArgument]);


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
    navigate('/');
    if (onClose) onClose();
  };

  const handleOverlayClick = () => {
    navigate('/');
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content1 animated-modal" onClick={(e) => e.stopPropagation()}>
      {resultData?.summary && (
          <div className="votestatic-summary-section">
            <h3>토론 요약</h3>
            <p className="votestatic-summary-text">{resultData.summary}</p>
          </div>
        )}
        <div className="votestatic-results-section">
        <h2 className="modal-title">
          {totalVotesLeft === totalVotesRight ? '동점!!' : '승자!!'}
        </h2>
        {maxParticipant.name && winningArgument && (
          <div className="winner-banner">
            {totalVotesLeft === totalVotesRight ? (
              <strong className="tie-text">
                <span className="animated-text">{leftArgument}</span> vs <span className="animated-text">{rightArgument}</span>
              </strong>
            ) : (
              <strong>
                <span className="animated-text winner-text">
                  {maxParticipant.name}의 주장 {winningArgument}!!
                </span>
              </strong>
            )}
          </div>
        )}
        <div className="chart-container">
          <HighchartsReact highcharts={Highcharts} options={participantChartOptions} />
        </div>
        <button onClick={handleClose} className="close-button1">닫기</button>
        </div>
      </div>
    </div>
  );
};

export default VoteStatistic;