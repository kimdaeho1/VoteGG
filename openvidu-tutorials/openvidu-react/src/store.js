import { configureStore } from '@reduxjs/toolkit';
import roomReducer from './roomSlice.js';

export const store = configureStore({
  reducer: {
    room: roomReducer,
  },
});

export default store;
