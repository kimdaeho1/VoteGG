import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SetUsername.css';

const SetUsername = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialId, setSocialId] = useState('');
  const [nickname, setNickname] = useState('');
  const [provider, setProvider] = useState('');

  useEffect(() => {
    // URL 파라미터에서 socialId, nickname, provider 가져오기
    const params = new URLSearchParams(window.location.search);
    setSocialId(params.get('kakaoId') || ''); // 'kakaoId'로 전달됨
    setNickname(params.get('nickname') || '');
    setProvider('카카오'); // 현재 카카오만 사용
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // 기존 오류 메시지 초기화

    try {
      // 서버로 아이디 설정 요청
      const response = await axios.post('/api/user/set-username', {
        socialId,
        nickname,
        username,
        provider,
      });

      if (response.status === 200) {
        alert('아이디 설정이 완료되었습니다.');
        // 홈으로 리디렉션
        window.location.href = '/';
      }
    } catch (error) {
      // 오류 처리
      setError(
        error.response?.data?.message || '아이디 설정 중 오류가 발생했습니다.'
      );
      console.error('아이디 설정 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="set-username-container">
      <h2>처음 가입 시 아이디를 설정해 주세요</h2>
      <p className="unique-warning-text">아이디는 한 번 설정 후 변경이 불가능합니다.</p>
      <p>소셜 플랫폼: {provider}</p>
      <p>플랫폼 닉네임: {nickname}</p>
      <form onSubmit={handleSubmit} className="set-username-form">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="새로운 아이디를 입력하세요"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '처리 중...' : '아이디 설정'}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default SetUsername;
