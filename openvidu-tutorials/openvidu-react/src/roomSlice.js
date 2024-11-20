import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  rooms: [
    { id: 1, name: '토론방 1', creator: 'user1', memberCount: 0 },
    { id: 2, name: '토론방 2', creator: 'user2', memberCount: 0 },
    // 추가 방 데이터를 여기 설정
  ],
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    updateMemberCount: (state, action) => {
      const { roomId, count } = action.payload;
      const room = state.rooms.find((room) => room.id === roomId);
      if (room) {
        room.memberCount = count;
      }
    },
  },
});

export const { updateMemberCount } = roomSlice.actions;
export default roomSlice.reducer;
