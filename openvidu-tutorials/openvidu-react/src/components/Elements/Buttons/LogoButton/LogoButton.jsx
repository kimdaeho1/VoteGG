import React from 'react';
import { Link } from 'react-router-dom';
import './LogoButton.css'

const LogoButton = () => {

  return (<Link to="/" className="logo-link">
    <img
      src="/logos.png" // 로고 이미지 경로
      alt="Agora Logo"
      className="logo-image"
    />
  </Link>);

}

export default LogoButton;