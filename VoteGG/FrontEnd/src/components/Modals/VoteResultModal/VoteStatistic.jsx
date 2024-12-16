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
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태
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
        setIsLoading(false); // 로딩 완료
      }
    };

    fetchParticipants();
  }, [roomNumber]);

  useEffect(() => {
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
      text: null,
    },
    colors: ['#FFD700', '#4D96FF', '#FFC75F', '#F9F871', '#FF8C42', '#845EC2'],
    credits: {
      enabled: false,
    },
    tooltip: {
      pointFormat: '<span style="font-size: 16px; font-weight: bold; color: #000000;">{series.name}</span>: <b>{point.y}</b>',
    },
    plotOptions: {
      pie: {
        allowPointSelect: false,
        innerSize: '50%',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}',
          style: { 
            fontSize: '16px', 
            color: '#1a237e',
            textOutline: 'none', 
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)' 
          },
        },
        showInLegend: true,
      },
    },
    legend: {
      itemStyle: {
        fontSize: '20px',
        color: '#1a237e',
        fontWeight: 'bold',
      },
      symbolHeight: 14,
      symbolRadius: 6,
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
        {isLoading ? (
          // 로딩 상태일 때 표시할 UI
          <div className="loading-container">
            <h2>집계중...</h2>
          </div>
        ) : (
          // 로딩 완료 후 기존 UI 표시
          <>
            {resultData?.summary && (
              <div className="votestatic-summary-section">
                <h3>토론 요약</h3>
                <p className="votestatic-summary-text">{resultData.summary}</p>
              </div>
            )}
            <div className="votestatic-results-section">
              {maxParticipant.name && winningArgument && (
                <div className="winner-banner">
                  {totalVotesLeft === totalVotesRight ? (
                    <strong className="tie-text">
                      <span className="animated-text">박빙!!</span>
                    </strong>
                  ) : (
                    <strong>
                      <span className="animated-text winner-text">
                        {winningArgument}의 {maxParticipant.name} 승리!!
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
          </>
        )}
      </div>
    </div>
  );
};

export default VoteStatistic;
