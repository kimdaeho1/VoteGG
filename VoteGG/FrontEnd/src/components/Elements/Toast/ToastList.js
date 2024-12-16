import React from "react";
import Toast from "./Toast";

const ToastList = ({ toasts }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "10%",
        right: "40%",
        zIndex: 1000,
        maxWidth: "1000px",
        width: "25%",
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
