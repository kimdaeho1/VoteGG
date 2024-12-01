import React from 'react';
import './AlarmModal.css';

// 기존 코드
const AlarmModal = ({ onClose }) => {
  return (
    <div className="alarm-modal">
      <div className="alarm-modal-content">
        <h2>알림</h2>
        <p>여기에 알림 내용이 표시됩니다.</p>
        <button className="close-alarm-button" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
};

// // 초대 코드
// const AlarmModal = ({ onClose, inviteLink }) => {
//   return (
//     <div className="alarm-modal">
//       <div className="alarm-modal-content">
//         <h2>알림</h2>
//         {inviteLink ? (
//           <div>
//             <p>초대 링크가 생성되었습니다:</p>
//             <p className="invite-link">{inviteLink}</p>
//             <button
//               className="copy-button"
//               onClick={() => navigator.clipboard.writeText(inviteLink)}
//             >
//               초대 링크 복사하기
//             </button>
//           </div>
//         ) : (
//           <p>알림 내용이 없습니다.</p>
//         )}
//         <button className="close-button" onClick={onClose}>
//           닫기
//         </button>
//       </div>
//     </div>
//   );
// };


export default AlarmModal;
