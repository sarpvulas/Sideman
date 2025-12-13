"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui";
import type { NoteHighlight } from "@/types";

export interface ChordDiagramProps {
  chordSymbol: string;
  notes?: NoteHighlight[];
  showLabels?: boolean;
  className?: string;
}

export function ChordDiagram({
  chordSymbol,
  notes = [],
  showLabels = true,
  className,
}: ChordDiagramProps) {
  return (
    <motion.div
      data-testid="chord-diagram"
      className={cn("flex flex-col items-center gap-4", className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Chord symbol */}
      <h2 className="text-4xl font-display font-bold text-primary-100">
        {chordSymbol}
      </h2>

      {/* Note legend (only if notes provided) */}
      {showLabels && notes.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {notes.map((note) => (
            <Badge
              key={note.note}
              variant={
                note.role === "root"
                  ? "success"
                  : note.role === "tension"
                  ? "error"
                  : "info"
              }
              size="sm"
            >
              {note.note.replace(/\d/, "")} ({note.role})
            </Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
}
