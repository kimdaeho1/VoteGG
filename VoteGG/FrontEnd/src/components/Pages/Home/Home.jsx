import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 리디렉션을 위한 useNavigate
import RoomList from '../../Elements/RoomList/RoomList.jsx';
import Live from '../../Elements/Live/Live.jsx';
import './Home.css';

const Home = () => {
  const [rooms, setRooms] = useState([]); // 방 리스트 상태
  const [token, setToken] = useState(localStorage.getItem('token') || null); // JWT 토큰 상태 초기화
  const navigate = useNavigate(); // 리디렉션을 위한 네비게이터

  // 쿠키에서 JWT 토큰 가져오는 함수
  const getTokenFromCookies = () => {
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=');
      acc[key] = value;
      return acc;
    }, {});
    return cookies['token'] || null;
  };

  useEffect(() => {
    // 컴포넌트 마운트 시 쿠키에서 토큰 확인
    const tokenFromCookies = getTokenFromCookies();

    if (tokenFromCookies && tokenFromCookies !== token) {
      // 로컬스토리지에 저장하고 상태 업데이트
      localStorage.setItem('token', tokenFromCookies);
      setToken(tokenFromCookies);

      // 첫 번째 리디렉션 완료 후, 리로드
      window.location.reload();
    }
  }, [token]); // 토큰 또는 네비게이터 변경 시 실행

  // 상태 확인용 디버깅 (개발 중 확인용)
  useEffect(() => {
    //console.log('Token updated:', token);
  }, [token]);

  return (
    <div className="home">
      <div
        className="home-background"
        style={{
          backgroundImage: 'url("/eggbackground.jpg")', // 경로 문제 해결된 상태에서 이 방식을 사용
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100vw',
          height: '80vh',
          zIndex: -1,
          minHeight: '790px',
          maxHeight: '790px',
          // opacity: '60%',
        }}
      ></div>
      <div
        className="home-background"
        style={{
          backgroundImage: 'url("/footer14.jpg")',
          backgroundSize: '100% 70%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'fixed',
          top: '76vh',
          right: 0,
          width: '100vw',
          height: '20vh',
          zIndex: -1,
          minHeight: '300px',
          maxHeight: '300px',
          opacity: '1',
        }}
      ></div>
      <div className='home-background2' />
      {/* <div className='home-background3' /> */}
      <div className="home-content">
        <Live />
        <RoomList rooms={rooms} />
      </div>
    </div>
  );
};

export default Home;
