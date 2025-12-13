"use client";

import { motion } from "framer-motion";
import { TrendingUp, Target, Clock, Trophy } from "lucide-react";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui";
import { useUserStore, ProgressRecord } from "@/stores/user-store";

export interface ProgressDashboardProps {
  className?: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className={cn("p-3 rounded-lg", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-primary-400">{label}</p>
        <p className="text-2xl font-bold text-primary-100">{value}</p>
        {subValue && <p className="text-xs text-primary-500">{subValue}</p>}
      </div>
    </Card>
  );
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-primary-300">{label}</span>
        <span className="text-primary-400">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 bg-primary-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent-teal"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function LessonProgressItem({ record }: { record: ProgressRecord }) {
  const accuracy =
    record.totalAttempts > 0
      ? Math.round((record.correctAttempts / record.totalAttempts) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-primary-800/50 rounded-lg"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-primary-100">{record.scoreTitle}</h4>
          <p className="text-xs text-primary-400">
            Last practiced:{" "}
            {new Date(record.lastPracticedAt).toLocaleDateString()}
          </p>
        </div>
        {record.completed && (
          <Trophy className="w-5 h-5 text-accent-gold" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-3">
        <ProgressBar
          value={record.barNumber}
          max={record.totalBars}
          label="Progress"
        />
        <div className="text-right">
          <p className="text-sm text-primary-400">Accuracy</p>
          <p
            className={cn(
              "text-lg font-bold",
              accuracy >= 80
                ? "text-accent-gold"
                : accuracy >= 60
                ? "text-accent-teal"
                : "text-accent-coral"
            )}
          >
            {accuracy}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function ProgressDashboard({ className }: ProgressDashboardProps) {
  const { progress, getTotalPracticeStats, user } = useUserStore();
  const stats = getTotalPracticeStats();

  // Sort progress by last practiced date
  const sortedProgress = [...progress].sort(
    (a, b) =>
      new Date(b.lastPracticedAt).getTime() - new Date(a.lastPracticedAt).getTime()
  );

  return (
    <div className={cn("space-y-8", className)}>
      {/* Welcome message */}
      {user && (
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-primary-100">
            Welcome back, {user.displayName}!
          </h2>
          <p className="text-primary-400 mt-1">Keep up the great practice!</p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Total Lessons"
          value={stats.totalLessons}
          color="bg-accent-teal"
        />
        <StatCard
          icon={Trophy}
          label="Completed"
          value={stats.completedLessons}
          subValue={`${stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}%`}
          color="bg-accent-gold"
        />
        <StatCard
          icon={TrendingUp}
          label="Accuracy"
          value={`${Math.round(stats.accuracy)}%`}
          color="bg-accent-coral"
        />
        <StatCard
          icon={Clock}
          label="Total Attempts"
          value={stats.totalAttempts}
          color="bg-primary-600"
        />
      </div>

      {/* Recent progress */}
      <Card>
        <h3 className="text-lg font-semibold text-primary-100 mb-4">
          Recent Practice
        </h3>

        {sortedProgress.length > 0 ? (
          <div className="space-y-4">
            {sortedProgress.slice(0, 5).map((record) => (
              <LessonProgressItem key={record.lessonId} record={record} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-primary-400">
            <p>No practice history yet.</p>
            <p className="text-sm mt-1">Start a lesson to track your progress!</p>
          </div>
        )}
      </Card>
    </div>
  );
}
