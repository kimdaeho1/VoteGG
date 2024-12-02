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

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const response = await fetch("/api/user/profile-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert("프로필 이미지가 업데이트되었습니다!");

        // JWT를 로컬스토리지에 저장
        localStorage.setItem("token", data.token);

        // 사용자 데이터 업데이트
        updateUserData();
      } else {
        alert(data.message || "업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("파일 업로드 중 오류:", error);
      alert("업로드 중 오류가 발생했습니다.");
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
        <div className="profile-img">
          <img
            src={userData?.profileImageUrl || "/defaultportrait.jpg"}
            alt="프로필"
            className="profile-image"
          />
        </div>
        <button
          className="edit-button"
          onClick={() => document.getElementById("fileInput").click()}
        >
          수정
        </button>
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
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
