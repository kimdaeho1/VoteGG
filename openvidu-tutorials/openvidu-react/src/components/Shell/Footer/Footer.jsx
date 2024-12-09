import React from "react";

const Footer = () => {
  const footerStyle = {
    backgroundImage: `url('/footer.jpg')`, // 이미지 경로 설정
    backgroundSize: "cover", // 이미지가 footer를 덮도록 설정
    backgroundPosition: "center", // 이미지가 중앙에 위치하도록 설정
    height: "200px", // footer 높이 설정
    color: "white", // 텍스트 색상
    display: "flex", // 콘텐츠 정렬
    alignItems: "center", // 세로 정렬
    justifyContent: "center", // 가로 정렬
  };

  return (
    <footer style={footerStyle}>
      <p>© 2024 My Website. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
