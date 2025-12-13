"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Music2, Sparkles, Headphones, Target } from "lucide-react";
import { PageContainer } from "@/components/layout";
import { ScoreUploader, AnalysisResult } from "@/components/score";
import { Card, SkeletonCard } from "@/components/ui";
import { useScoreStore } from "@/lib/store";
import type { ScoreAnalysis } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<ScoreAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/score/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      setAnalysis(result.data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleStartLesson = useCallback(async () => {
    if (!analysis) return;

    try {
      const response = await fetch("/api/lesson/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to start lesson");
      }

      router.push(`/lesson/${result.data.lessonId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start lesson");
    }
  }, [analysis, router]);

  return (
    <PageContainer>
      {/* Hero section (shown when no analysis) */}
      {!analysis && !isUploading && (
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-100 mb-4">
            Master Jazz Piano Voicings
          </h1>
          <p className="text-xl text-primary-300 max-w-2xl mx-auto">
            Upload any jazz lead sheet and get instant analysis, chord voicing
            suggestions, and personalized feedback as you practice.
          </p>
        </motion.div>
      )}

      {/* Upload zone */}
      {!analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ScoreUploader onUpload={handleUpload} isUploading={isUploading} />
        </motion.div>
      )}

      {/* Loading skeleton */}
      {isUploading && (
        <motion.div
          data-testid="analysis-loading"
          className="max-w-2xl mx-auto space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-accent-teal border-t-transparent rounded-full animate-spin" />
              <p className="text-primary-300">Analyzing your score with AI...</p>
              <p className="text-sm text-primary-500">
                Extracting chords, modes, and voicing suggestions
              </p>
            </div>
          </Card>
          <SkeletonCard />
          <SkeletonCard />
        </motion.div>
      )}

      {/* Analysis result */}
      {analysis && !isUploading && (
        <AnalysisResult
          title={analysis.title}
          keySignature={analysis.key}
          timeSignature={analysis.timeSignature}
          form={analysis.form}
          bars={analysis.bars}
          onStartLesson={handleStartLesson}
        />
      )}

      {/* Error display */}
      {error && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto mt-4 p-4 bg-accent-coral/20 border border-accent-coral/50 rounded-lg text-center"
        >
          <p className="text-accent-coral">{error}</p>
        </motion.div>
      )}

      {/* Features section (shown when no analysis) */}
      {!analysis && !isUploading && (
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-accent-gold" />
            </div>
            <h3 className="text-lg font-semibold text-primary-100 mb-2">
              AI Score Analysis
            </h3>
            <p className="text-sm text-primary-400">
              Upload any lead sheet and get instant chord extraction with
              suggested voicings and modes.
            </p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-accent-teal/20 flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-6 h-6 text-accent-teal" />
            </div>
            <h3 className="text-lg font-semibold text-primary-100 mb-2">
              Audio Recognition
            </h3>
            <p className="text-sm text-primary-400">
              Play chords on your piano and get real-time feedback on your
              voicings and technique.
            </p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-piano-highlight-seventh/20 flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-piano-highlight-seventh" />
            </div>
            <h3 className="text-lg font-semibold text-primary-100 mb-2">
              Personalized Coaching
            </h3>
            <p className="text-sm text-primary-400">
              Get tailored suggestions for improving your jazz comping and
              improvisation skills.
            </p>
          </Card>
        </motion.div>
      )}
    </PageContainer>
  );
}
