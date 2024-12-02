import React from "react";

const Toast = ({ type, children }) => {
  const backgroundColors = {
    success: "#4caf50",
    error: "#f44336",
    info: "#2196f3",
    warning: "#ff9800",
  };

  return (
    <div
      style={{
        padding: "15px 30px",
        marginBottom: "15px",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "bold",
        backgroundColor: backgroundColors[type] || "#333",
        color: "#fff",
        boxShadow: "0px 6px 8px rgba(0,0,0,0.2)",
      }}
    >
      {children}
    </div>
  );
};

export default Toast;