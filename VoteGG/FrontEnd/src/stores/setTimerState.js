// setTimerState.js

import { resetTimerState } from './TimerAtom';
import { RecoilState } from 'recoil';

let setResetTimerFunc = null;

export const registerSetResetTimerFunc = (func) => {
  setResetTimerFunc = func;
};

export const triggerResetTimer = () => {
  if (setResetTimerFunc) {
    setResetTimerFunc(true);
  }
};