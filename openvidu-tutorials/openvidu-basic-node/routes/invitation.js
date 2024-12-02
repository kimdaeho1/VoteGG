const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Invitation 스키마 및 모델 정의
const invitationSchema = new mongoose.Schema({
  inviter: { type: String, required: true },
  invitee: { type: String, required: true },
  roomId: { type: String, required: true },
  status: { type: String, default: 'pending' },
  timestamp: { type: Date, default: Date.now },
});

const Invitation = mongoose.model('Invitation', invitationSchema);

// 초대 생성 API
router.post('/invite', async (req, res) => {
  const { inviter, invitee, roomId } = req.body;

  try {
    const invitation = new Invitation({ inviter, invitee, roomId });
    await invitation.save();
    res.status(201).json({ message: '초대가 성공적으로 생성되었습니다.', invitation });
  } catch (error) {
    res.status(500).json({ message: '초대 생성 중 오류가 발생했습니다.', error });
  }
});

// 초대 목록 조회 API (사용자별)
router.get('/invitations/:username', async (req, res) => {
  const { username } = req.params;
  let responded = false; // 응답 여부 추적 변수

  try {
    const pendingInvitations = await Invitation.find({ invitee: username, status: 'pending' });

    if (pendingInvitations.length > 0) {
      responded = true;
      return res.json(pendingInvitations); // 초대가 있으면 즉시 응답
    }

    const checkForNewInvitations = setInterval(async () => {
      const updatedInvitations = await Invitation.find({ invitee: username, status: 'pending' });

      if (updatedInvitations.length > 0 && !responded) {
        clearInterval(checkForNewInvitations);
        responded = true; // 응답 상태 업데이트
        return res.json(updatedInvitations); // 새 초대가 있으면 응답
      }
    }, 1000);

    setTimeout(() => {
      if (!responded) {
        clearInterval(checkForNewInvitations);
        responded = true; // 응답 상태 업데이트
        res.json([]); // 타임아웃 시 빈 배열 반환
      }
    }, 30000); // 최대 30초 대기
  } catch (error) {
    if (!responded) {
      res.status(500).json({ message: '초대 목록 조회 중 오류가 발생했습니다.', error });
    }
  }
});

// 초대 응답 API (수락/거절)
router.post('/invitations/respond', async (req, res) => {
  const { id, response } = req.body; // id: 초대 ID, response: 'accepted' 또는 'declined'

  try {
    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return res.status(404).json({ message: '초대를 찾을 수 없습니다.' });
    }

    invitation.status = response;
    await invitation.save();
    res.json({ message: `초대가 ${response}되었습니다.`, invitation });
  } catch (error) {
    res.status(500).json({ message: '초대 응답 처리 중 오류가 발생했습니다.', error });
  }
});

module.exports = router;
