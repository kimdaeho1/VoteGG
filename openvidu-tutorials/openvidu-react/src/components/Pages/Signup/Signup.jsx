import React, { useState } from 'react';
import axios from 'axios';
import './Signup.css';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../Elements/Toast/ToastContext';

const Signup = () => {
  const [username, setUsername] = useState(''); // nickname을 username으로 변경
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSignup = async () => {
    try {
      // API 요청: 회원가입
      const response = await axios.post(window.location.origin + '/api/user/users', {
        username, // nickname을 username으로 변경
        password,
        confirmPassword,
      });

      // 요청 성공 시 처리
      if (response.status === 201) {
        addToast("회원가입이 완료되었습니다!", "success");
        navigate('/login'); // 회원가입 성공 시 로그인 페이지로 이동
      }
    } catch (error) {
      // 요청 실패 시 오류 처리
      if (error.response && error.response.status === 400) {
        setError(error.response.data.message);
      } else {
        setError('회원가입 중 문제가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className="signup-container">
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
      <div className='home-background2' />
      <div className='home-background3' />
      <h2>Sign Up</h2>
      <p>회원가입에 필요한 정보를 입력하세요.</p>
      <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
        <div className="input-wrapper">
          <span className="input-icon">👤</span>
          <input
            type="text"
            value={username} // nickname을 username으로 변경
            onChange={(e) => setUsername(e.target.value)} // nickname을 username으로 변경
            placeholder="Enter your ID"
            required
          />
        </div>
        <div className="input-wrapper">
          <span className="input-icon">🔒</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your Password"
            required
          />
        </div>
        <div className="input-wrapper">
          <span className="input-icon">🔒</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your Password"
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="button" onClick={handleSignup}>
          Sign Up
        </button>
      </form>
      <a href="/login" className="login-link">
        이미 아이디가 존재한가요? 로그인
      </a>
    </div>
  );
};

export default Signup;