import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';

const VoteStatistic = ({ onClose }) => {
  const [chartData, setChartData] = useState([]); // 차트 데이터를 저장할 상태
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태

  // URL에서 roomNumber를 직접 파싱 (방 번호를 URL에서 가져오기)
  const roomNumber = window.location.pathname.split('/').pop();
  console.log(`Requesting participants for room: ${roomNumber}`);  // 디버그 로그

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/room/${roomNumber}/participants`);
        const participants = response.data; // [id, 득표수] 형식의 배열

        // 차트 데이터 형식에 맞게 변환
        const data = participants.map(([id, votes]) => ({
          name: id,  // 참가자 ID
          y: votes   // 득표수
        }));

        setChartData(data); // 차트 데이터 설정
        setIsLoading(false); // 로딩 완료
      } catch (error) {
        console.error('Error fetching participants:', error);
        setError('참가자 목록을 가져오는 중 오류가 발생했습니다.');
        setIsLoading(false); // 로딩 완료
      }
    };

    fetchParticipants();
  }, [roomNumber]); // roomNumber가 변경될 때마다 데이터 재요청

  // 차트 옵션
  const options = {
    chart: {
      type: 'pie',
    },
    title: {
      text: '참가자 득표 현황',
    },
    plotOptions: {
      pie: {
        innerSize: '50%',  // 도넛 차트 형태로 만들기
        dataLabels: {
          enabled: true,
          format: '{point.name}: {point.y}', // 이름과 득표수 표시
        },
      },
    },
    series: [{
      name: '득표수',
      colorByPoint: true,
      data: chartData, // API에서 받은 데이터
    }],
  };

  // 로딩 중일 때 표시할 메시지
  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  // 에러가 발생했을 경우
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>타이머 종료!</h2>
        <p>타이머가 종료되었습니다! 여기에 도넛 차트나 결과를 표시할 수 있습니다.</p>

        {/* 하이차트 도넛 차트 */}
        <HighchartsReact highcharts={Highcharts} options={options} />

        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

export default VoteStatistic;
