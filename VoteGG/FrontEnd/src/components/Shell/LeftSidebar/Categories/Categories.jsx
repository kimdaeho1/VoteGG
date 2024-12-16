import React, { useEffect, useState } from "react";
import "./Categories.css";
import { useToast } from '../../../Elements/Toast/ToastContext'; // useToast import
import PersonalHistory from "../../../Modals/PersonalHistoryModal/PersonalHistoryModal.jsx"; // PersonalHistory 컴포넌트 import
import jwt_decode from "jwt-decode"; // jwt_decode import

const Categories = () => {
  const { addToast } = useToast(); // ToastContext에서 addToast 가져오기
  const [userData, setUserData] = useState(null); // 사용자 데이터 상태
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token")); // 로그인 여부 상태
  const [showModal, setShowModal] = useState(false); // 모달 표시 상태

  const updateUserData = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Use jwt_decode to decode the token and extract user data
        const payload = jwt_decode(token);
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
        console.error("토큰 디코딩 오류:", error);
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
        addToast("프로필 이미지가 업데이트되었습니다!", "success"); // 성공 토스트 메시지

        // JWT를 로컬스토리지에 저장
        localStorage.setItem("token", data.token);

        // 사용자 데이터 업데이트
        updateUserData();
      } else {
        addToast(data.message || "업로드에 실패했습니다.", "error"); // 실패 토스트 메시지
      }
    } catch (error) {
      console.error("파일 업로드 중 오류:", error);
      addToast("업로드 중 오류가 발생했습니다.", "error"); // 오류 토스트 메시지
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
        <h2 className="profile-hello">Hello!</h2>
        <div className="profile-img">
          <img
            src={userData?.profileImageUrl || "/defaultportrait.jpg"}
            alt="프로필"
            onClick={() => document.getElementById("fileInput").click()}
            className="profile-image"
          />
        </div>
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
        <button className="history-button" onClick={() => setShowModal(true)}>
          결과 기록
        </button>
      </div>
      {showModal && <PersonalHistory onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Categories;
