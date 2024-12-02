//src/components/Shell/LeftSidebar/Categories/Categories.jsx

import React, { useEffect, useState } from "react";
import "./Categories.css";

const Categories = () => {
  const [userData, setUserData] = useState(null); // 사용자 데이터 상태
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token")); // 로그인 여부 상태

  const updateUserData = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserData({
          username: payload.username || "정보 없음",
          profileImageUrl: payload.profileImageUrl || "/defaultportrait.jpg",
          totalParticipations: payload.totalParticipations || 0,
          totalWins: payload.totalWins || 0,
          firstPlaceWins: payload.firstPlaceWins || 0,
          winRate:
            payload.totalParticipations > 0
              ? ((payload.totalWins / payload.totalParticipations) * 100).toFixed(2)
              : 0,
        });
        setIsLoggedIn(true);
      } catch (error) {
        console.error("토큰 파싱 오류:", error);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    updateUserData();
    const handleUserStatusChanged = () => updateUserData();

    document.addEventListener("userStatusChanged", handleUserStatusChanged);

    return () => {
      document.removeEventListener("userStatusChanged", handleUserStatusChanged);
    };
  }, []);

  if (!isLoggedIn) {
    // 로그인 상태가 false면 "로그인이 필요합니다" 메시지 표시
    return (
      <div className="profile-container">
      <div className="profile-header">
      <div className="profile-info">
        <p className="username">로그인이 필요합니다.</p>
        </div>
      </div>
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
