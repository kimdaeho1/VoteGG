import React, { useEffect, useState } from "react";
import "./Categories.css";

const Categories = () => {
  const [userData, setUserData] = useState(null); // 사용자 데이터 상태
  const [isLoggedIn, setIsLoggedIn] = useState(true); // 로그인 여부 상태

  useEffect(() => {
    const token = localStorage.getItem("token"); // JWT 토큰 가져오기
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1])); // JWT 페이로드 디코딩
        const {
          username = "정보 없음",
          profileImageUrl = "/defaultportrait.jpg", // 기본 프로필 사진 경로
          totalParticipations = 0, // 기본값: 0
          totalWins = 0, // 기본값: 0
          firstPlaceWins = 0, // 기본값: 0
        } = payload;

        // 승률 계산
        const winRate =
          totalParticipations > 0
            ? ((totalWins / totalParticipations) * 100).toFixed(2)
            : 0;

        // 사용자 데이터 설정
        setUserData({
          username,
          profileImageUrl,
          totalParticipations,
          totalWins,
          firstPlaceWins,
          winRate,
        });
      } catch (error) {
        console.error("토큰 파싱 오류:", error);
        setIsLoggedIn(false); // 로그인 상태를 false로 설정
      }
    } else {
      setIsLoggedIn(false); // 토큰이 없을 경우 로그인 상태를 false로 설정
    }
  }, []);

  if (!isLoggedIn) {
    // 로그인 상태가 false면 "로그인이 필요합니다" 메시지 표시
    return (
      <div className="login-message">
        <p>로그인이 필요합니다</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        {/* 프로필 이미지 */}
        <div className="profile-img">
          <img
            src={userData?.profileImageUrl || "/defaultportrait.jpg"}
            alt="프로필"
            className="profile-image"
          />
        </div>
        {/* 수정 버튼 */}
        <button className="edit-button">수정</button>
      </div>
      <div className="profile-info">
        <p className="username">{userData?.username || "정보 없음"} 님</p>
        <p>토론승률: {userData?.winRate || 0} %</p>
        <p>토론우승: {userData?.firstPlaceWins || 0} 회</p>
      </div>
    </div>
  );
};

export default Categories;
