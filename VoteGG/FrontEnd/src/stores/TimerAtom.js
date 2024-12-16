// TimerAtom.js

import { atom } from 'recoil';

export const resetTimerState = atom({
  key: 'resetTimerState',
  default: false,
});