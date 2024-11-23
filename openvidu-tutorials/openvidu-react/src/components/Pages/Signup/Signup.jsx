import React, { useState } from 'react';
import axios from 'axios';
import './Signup.css';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [username, setUsername] = useState(''); // nickname을 username으로 변경
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      // API 요청: 회원가입
      const response = await axios.post('https://kimseongwook.shop:8443/api/user/users', {
        username, // nickname을 username으로 변경
        password,
        confirmPassword,
      });

      // 요청 성공 시 처리
      if (response.status === 201) {
        setError('');
        alert('회원가입이 완료되었습니다!');
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
      <h2>Sign Up</h2>
      <p>Fill in the details to create an account</p>
      <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
        <div className="input-wrapper">
          <span className="input-icon">👤</span>
          <input
            type="text"
            value={username} // nickname을 username으로 변경
            onChange={(e) => setUsername(e.target.value)} // nickname을 username으로 변경
            placeholder="Enter your username"
            required
          />
        </div>
        <div className="input-wrapper">
          <span className="input-icon">🔒</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        <div className="input-wrapper">
          <span className="input-icon">🔒</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="button" onClick={handleSignup}>
          Sign Up
        </button>
      </form>
      <a href="/login" className="login-link">
        Already have an account? Log in
      </a>
    </div>
  );
};

export default Signup;