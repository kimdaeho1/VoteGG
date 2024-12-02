import React from "react";
import Toast from "./Toast";

const ToastList = ({ toasts }) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 1000,
        maxWidth: "1000px",
        width: "15%",
      }}
    >
      {toasts.map(({ message, type }, index) => (
        <Toast type={type} key={index}>
          {message}
        </Toast>
      ))}
    </div>
  );
};

export default ToastList;
