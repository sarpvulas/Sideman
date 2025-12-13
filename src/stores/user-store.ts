"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

export interface ProgressRecord {
  lessonId: string;
  scoreTitle: string;
  barNumber: number;
  totalBars: number;
  correctAttempts: number;
  totalAttempts: number;
  lastPracticedAt: Date;
  completed: boolean;
}

export interface UserState {
  // Auth state
  isAuthenticated: boolean;
  user: UserProfile | null;

  // Progress
  progress: ProgressRecord[];

  // Settings
  settings: {
    defaultVoicing: string;
    metronomeEnabled: boolean;
    tempo: number;
    countInBars: number;
  };

  // Actions
  login: (email: string, displayName: string) => void;
  logout: () => void;
  updateProgress: (record: ProgressRecord) => void;
  getProgressForLesson: (lessonId: string) => ProgressRecord | undefined;
  updateSettings: (settings: Partial<UserState["settings"]>) => void;
  getTotalPracticeStats: () => {
    totalLessons: number;
    completedLessons: number;
    totalAttempts: number;
    accuracy: number;
  };
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      progress: [],
      settings: {
        defaultVoicing: "shell",
        metronomeEnabled: false,
        tempo: 120,
        countInBars: 1,
      },

      login: (email: string, displayName: string) => {
        const user: UserProfile = {
          id: `user-${Date.now()}`,
          email,
          displayName,
          createdAt: new Date(),
        };
        set({ isAuthenticated: true, user });
      },

      logout: () => {
        set({ isAuthenticated: false, user: null });
      },

      updateProgress: (record: ProgressRecord) => {
        const { progress } = get();
        const existingIndex = progress.findIndex((p) => p.lessonId === record.lessonId);

        if (existingIndex >= 0) {
          const updated = [...progress];
          updated[existingIndex] = record;
          set({ progress: updated });
        } else {
          set({ progress: [...progress, record] });
        }
      },

      getProgressForLesson: (lessonId: string) => {
        return get().progress.find((p) => p.lessonId === lessonId);
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      getTotalPracticeStats: () => {
        const { progress } = get();
        const totalLessons = progress.length;
        const completedLessons = progress.filter((p) => p.completed).length;
        const totalAttempts = progress.reduce((sum, p) => sum + p.totalAttempts, 0);
        const correctAttempts = progress.reduce((sum, p) => sum + p.correctAttempts, 0);
        const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

        return {
          totalLessons,
          completedLessons,
          totalAttempts,
          accuracy,
        };
      },
    }),
    {
      name: "sideman-user-store",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        progress: state.progress,
        settings: state.settings,
      }),
    }
  )
);
