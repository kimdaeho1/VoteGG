import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SetUsername.css';
import { useToast } from '../../Elements/Toast/ToastContext';

const SetUsername = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialId, setSocialId] = useState('');
  const [nickname, setNickname] = useState('');
  const [provider, setProvider] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    // URL 파라미터에서 socialId, nickname, provider 가져오기
    const params = new URLSearchParams(window.location.search);
    setSocialId(params.get('kakaoId') || ''); // 'kakaoId'로 전달됨
    setNickname(params.get('nickname') || '');
    setProvider('kakao'); // 현재 카카오만 사용
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
        addToast('아이디 설정이 완료되었습니다.', 'success');
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
      <h2>아이디 설정</h2>
      <p>제공자: {provider}</p>
      <p>소셜 닉네임: {nickname}</p>
      <form onSubmit={handleSubmit}>
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
