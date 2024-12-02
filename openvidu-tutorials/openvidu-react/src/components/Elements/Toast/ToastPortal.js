import ReactDOM from "react-dom";
import ToastList from "./ToastList";

const ToastPortal = ({ toasts }) => {
  return ReactDOM.createPortal(
    <ToastList toasts={toasts} />,
    document.getElementById("toast")
  );
};

export default ToastPortal;