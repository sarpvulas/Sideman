import { create } from "zustand";
import type { LessonState, ScoreState, Lesson, Bar, ScoreAnalysis } from "@/types";

export const useLessonStore = create<LessonState>((set) => ({
  currentLesson: null,
  currentBar: null,
  isRecording: false,
  isAnalyzing: false,
  lastFeedback: null,

  setLesson: (lesson: Lesson) => set({ currentLesson: lesson }),
  setCurrentBar: (bar: Bar) => set({ currentBar: bar }),
  setRecording: (recording: boolean) => set({ isRecording: recording }),
  setAnalyzing: (analyzing: boolean) => set({ isAnalyzing: analyzing }),
  setFeedback: (feedback: string | null) => set({ lastFeedback: feedback }),
  reset: () =>
    set({
      currentLesson: null,
      currentBar: null,
      isRecording: false,
      isAnalyzing: false,
      lastFeedback: null,
    }),
}));

export const useScoreStore = create<ScoreState>((set) => ({
  currentAnalysis: null,
  isUploading: false,
  isAnalyzing: false,
  error: null,

  setAnalysis: (analysis: ScoreAnalysis) => set({ currentAnalysis: analysis }),
  setUploading: (uploading: boolean) => set({ isUploading: uploading }),
  setAnalyzing: (analyzing: boolean) => set({ isAnalyzing: analyzing }),
  setError: (error: string | null) => set({ error }),
  reset: () =>
    set({
      currentAnalysis: null,
      isUploading: false,
      isAnalyzing: false,
      error: null,
    }),
}));
