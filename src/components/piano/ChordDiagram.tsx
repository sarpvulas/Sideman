"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { PianoKeyboard } from "./PianoKeyboard";
import { Badge } from "@/components/ui";
import type { NoteHighlight, VoicingType } from "@/types";

export interface ChordDiagramProps {
  chordSymbol: string;
  notes: NoteHighlight[];
  voicingType?: VoicingType;
  showLabels?: boolean;
  className?: string;
}

const voicingLabels: Record<VoicingType, string> = {
  shell: "Shell Voicing",
  rootless: "Rootless",
  "drop-2": "Drop-2",
  quartal: "Quartal",
  full: "Full Voicing",
};

export function ChordDiagram({
  chordSymbol,
  notes,
  voicingType = "shell",
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
      {/* Chord symbol and voicing type */}
      <div className="flex items-center gap-3">
        <h2 className="text-3xl font-display font-bold text-primary-100">
          {chordSymbol}
        </h2>
        {showLabels && (
          <Badge variant="info" size="sm">
            {voicingLabels[voicingType]}
          </Badge>
        )}
      </div>

      {/* Piano keyboard with highlights */}
      <div className="overflow-x-auto pb-4">
        <PianoKeyboard
          startOctave={3}
          endOctave={5}
          highlightedNotes={notes}
        />
      </div>

      {/* Note legend */}
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
