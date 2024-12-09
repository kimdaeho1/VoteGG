import { create } from 'zustand';  // create 수정

const useTranscriptionStore = create((set) => ({
  transcriptionHistory: [],
  addTranscription: (transcription) => set((state) => ({
    transcriptionHistory: [...state.transcriptionHistory, transcription]
  })),
  clearTranscriptions: () => set({ transcriptionHistory: [] })
}));

export default useTranscriptionStore;