import React, { createContext, useContext, useState } from 'react';
import ToastPortal from './ToastPortal.js';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    console.error("ToastContext가 제공되지 않았습니다. ToastProvider를 확인하세요.");
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type) => {
    setToasts((prevToasts) => [...prevToasts, { message, type }]);
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.slice(1));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastPortal toasts={toasts} />
    </ToastContext.Provider>
  );
};
