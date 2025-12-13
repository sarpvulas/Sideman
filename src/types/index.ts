// Core music theory types
export interface ChordSymbol {
  root: string;
  quality: ChordQuality;
  extensions: string[];
  bass: string | null;
}

export type ChordQuality =
  | "major"
  | "minor"
  | "dominant7"
  | "major7"
  | "minor7"
  | "diminished"
  | "augmented"
  | "half-diminished"
  | "diminished7"
  | "augmented7"
  | "minorMajor7";

export type VoicingType = "shell" | "rootless" | "drop-2" | "quartal" | "full";

export type NoteRole = "root" | "third" | "fifth" | "seventh" | "ninth" | "eleventh" | "thirteenth" | "tension";

export interface NoteHighlight {
  note: string;
  role: NoteRole;
}

export interface VoicingNote {
  note: string;
  role: NoteRole;
}

// Score analysis types
export interface ScoreAnalysis {
  id: string;
  title: string;
  key: string;
  timeSignature: string;
  form: string[];
  bars: Bar[];
  createdAt: Date;
}

export interface Bar {
  barNumber: number;
  chordSymbol: string;
  recommendedVoicing: string[];
  voicingNotes?: VoicingNote[];
  improvModes: ImprovMode[];
}

export interface ImprovMode {
  mode: string;
  why: string;
}

// Lesson types
export interface Lesson {
  id: string;
  scoreAnalysisId: string;
  currentBarIndex: number;
  totalBars: number;
  attempts: Attempt[];
  startedAt: Date;
  completedAt?: Date;
}

export interface Attempt {
  id: string;
  barNumber: number;
  detectedChord: DetectedChord | null;
  expectedChord: string;
  correct: boolean;
  confidence: number;
  feedback: string;
  timestamp: Date;
}

export interface DetectedChord {
  root: string;
  quality: string;
  voicing: VoicingType;
  notes: string[];
  confidence: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UploadResponse {
  analysisId: string;
  analysis: ScoreAnalysis;
}

export interface StartLessonResponse {
  lessonId: string;
  lesson: Lesson;
  currentBar: Bar;
}

export interface AttemptResponse {
  correct: boolean;
  detectedChord: DetectedChord | null;
  feedback: string;
  nextBar: Bar | null;
  lessonComplete: boolean;
}

// Component prop types
export interface AnimatableProps {
  animate?: boolean;
  animationDuration?: number;
}

export interface ThemeableProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

// Store types
export interface LessonState {
  currentLesson: Lesson | null;
  currentBar: Bar | null;
  isRecording: boolean;
  isAnalyzing: boolean;
  lastFeedback: string | null;
  setLesson: (lesson: Lesson) => void;
  setCurrentBar: (bar: Bar) => void;
  setRecording: (recording: boolean) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setFeedback: (feedback: string | null) => void;
  reset: () => void;
}

export interface ScoreState {
  currentAnalysis: ScoreAnalysis | null;
  isUploading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  setAnalysis: (analysis: ScoreAnalysis) => void;
  setUploading: (uploading: boolean) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
