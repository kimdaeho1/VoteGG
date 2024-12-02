import React from "react";
import Toast from "./Toast";

const ToastList = ({ toasts }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "15%",
        zIndex: 1000,
        maxWidth: "1000px",
        width: "20%",
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
