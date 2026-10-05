"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, Music, Award } from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card, Badge, Skeleton } from "@/components/ui";
import { staggerContainerVariants, staggerItemVariants } from "@/hooks";

interface ProgressData {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  lessonsCompleted: number;
  averageConfidence: number;
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch("/api/progress");
        const result = await response.json();

        if (result.success) {
          setProgress(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-8 w-8 mb-4" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-display font-bold text-primary-100 text-center mb-8">
          Your Progress
        </h1>
        <p className="text-sm text-primary-400 text-center -mt-6 mb-8">
          Sample data: progress is not saved between sessions yet.
        </p>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItemVariants}>
            <Card className="text-center">
              <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-accent-gold" />
              </div>
              <p className="text-3xl font-bold text-primary-100 mb-1">
                {progress?.accuracy || 0}%
              </p>
              <p className="text-sm text-primary-400">Accuracy</p>
            </Card>
          </motion.div>

          <motion.div variants={staggerItemVariants}>
            <Card className="text-center">
              <div className="w-12 h-12 rounded-xl bg-accent-teal/20 flex items-center justify-center mx-auto mb-4">
                <Music className="w-6 h-6 text-accent-teal" />
              </div>
              <p className="text-3xl font-bold text-primary-100 mb-1">
                {progress?.totalAttempts || 0}
              </p>
              <p className="text-sm text-primary-400">Total Attempts</p>
            </Card>
          </motion.div>

          <motion.div variants={staggerItemVariants}>
            <Card className="text-center">
              <div className="w-12 h-12 rounded-xl bg-piano-highlight-seventh/20 flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-piano-highlight-seventh" />
              </div>
              <p className="text-3xl font-bold text-primary-100 mb-1">
                {progress?.lessonsCompleted || 0}
              </p>
              <p className="text-sm text-primary-400">Lessons Completed</p>
            </Card>
          </motion.div>

          <motion.div variants={staggerItemVariants}>
            <Card className="text-center">
              <div className="w-12 h-12 rounded-xl bg-accent-amber/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-accent-amber" />
              </div>
              <p className="text-3xl font-bold text-primary-100 mb-1">
                {Math.round((progress?.averageConfidence || 0) * 100)}%
              </p>
              <p className="text-sm text-primary-400">Avg Confidence</p>
            </Card>
          </motion.div>
        </motion.div>

        {/* Accuracy bar */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-primary-100 mb-4">
            Overall Performance
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-primary-400 mb-2">
                <span>Correct Attempts</span>
                <span>
                  {progress?.correctAttempts || 0} / {progress?.totalAttempts || 0}
                </span>
              </div>
              <div className="h-4 bg-primary-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-gold to-accent-teal"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress?.accuracy || 0}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Recent activity placeholder */}
        <Card>
          <h3 className="text-lg font-semibold text-primary-100 mb-4">
            Recent Activity
          </h3>

          <div className="space-y-3">
            {[
              { chord: "Cm7", correct: true, time: "2 min ago" },
              { chord: "F7", correct: true, time: "5 min ago" },
              { chord: "BbMaj7", correct: false, time: "8 min ago" },
              { chord: "EbMaj7", correct: true, time: "12 min ago" },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-primary-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={activity.correct ? "success" : "error"}>
                    {activity.chord}
                  </Badge>
                  <span className="text-sm text-primary-300">
                    {activity.correct ? "Correct" : "Needs practice"}
                  </span>
                </div>
                <span className="text-xs text-primary-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </PageContainer>
  );
}
