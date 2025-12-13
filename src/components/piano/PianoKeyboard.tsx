"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import type { NoteHighlight } from "@/types";

export interface PianoKeyboardProps {
  startOctave?: number;
  endOctave?: number;
  highlightedNotes?: (string | NoteHighlight)[];
  onKeyPress?: (note: string) => void;
  showLabels?: boolean;
  className?: string;
}

interface KeyProps {
  note: string;
  isBlack: boolean;
  highlight?: NoteHighlight;
  showLabel?: boolean;
  onPress?: () => void;
}

const roleColors: Record<string, string> = {
  root: "bg-red-500",
  third: "bg-orange-500",
  fifth: "bg-cyan-500",
  seventh: "bg-purple-500",
  ninth: "bg-blue-500",
  eleventh: "bg-green-500",
  thirteenth: "bg-yellow-500",
  tension: "bg-pink-500",
};

// Enharmonic mappings for black keys
const blackKeyLabels: Record<string, { sharp: string; flat: string }> = {
  "C#": { sharp: "C#", flat: "Db" },
  "D#": { sharp: "D#", flat: "Eb" },
  "F#": { sharp: "F#", flat: "Gb" },
  "G#": { sharp: "G#", flat: "Ab" },
  "A#": { sharp: "A#", flat: "Bb" },
};

function Key({ note, isBlack, highlight, showLabel = true, onPress }: KeyProps) {
  const isHighlighted = !!highlight;
  const highlightColor = highlight ? roleColors[highlight.role] : "";
  const noteName = note.replace(/\d/, "");

  return (
    <motion.button
      data-testid={`piano-key-${note}`}
      data-key-type={isBlack ? "black" : "white"}
      data-highlighted={isHighlighted}
      data-voicing={highlight?.role}
      className={cn(
        "relative transition-all duration-50 flex flex-col items-center justify-end",
        isBlack
          ? cn(
              "w-7 sm:w-8 h-20 sm:h-24 -mx-3.5 sm:-mx-4 z-10 rounded-b-md pb-1.5",
              isHighlighted ? highlightColor : "bg-gray-900",
              !isHighlighted && "hover:bg-gray-800"
            )
          : cn(
              "w-11 sm:w-12 h-32 sm:h-36 rounded-b-lg border border-gray-300 pb-2.5",
              isHighlighted ? highlightColor : "bg-white",
              !isHighlighted && "hover:bg-gray-100"
            ),
        isHighlighted && "shadow-lg ring-2 ring-white"
      )}
      whileTap={{ y: 2, boxShadow: "0 0 0 rgba(0,0,0,0)" }}
      onClick={onPress}
      aria-label={`Piano key ${note}${isHighlighted ? ` (${highlight?.role})` : ""}`}
    >
      {showLabel && (
        isBlack ? (
          <div className="text-center leading-tight">
            <span className={cn(
              "text-[10px] sm:text-xs font-semibold block",
              isHighlighted ? "text-white" : "text-gray-200"
            )}>
              {blackKeyLabels[noteName]?.sharp || noteName}
            </span>
            <span className={cn(
              "text-[10px] sm:text-xs font-semibold block",
              isHighlighted ? "text-white/80" : "text-gray-400"
            )}>
              {blackKeyLabels[noteName]?.flat || noteName}
            </span>
          </div>
        ) : (
          <span className={cn(
            "text-xs sm:text-sm font-semibold",
            isHighlighted ? "text-white" : "text-gray-700"
          )}>
            {noteName}
          </span>
        )
      )}
    </motion.button>
  );
}

export function PianoKeyboard({
  startOctave = 3,
  endOctave = 5,
  highlightedNotes = [],
  onKeyPress,
  showLabels = true,
  className,
}: PianoKeyboardProps) {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const whiteNotes = ["C", "D", "E", "F", "G", "A", "B"];
  const blackNotes = ["C#", "D#", "F#", "G#", "A#"];

  // Enharmonic equivalents mapping
  const enharmonics: Record<string, string> = {
    "Db": "C#", "C#": "Db",
    "Eb": "D#", "D#": "Eb",
    "Gb": "F#", "F#": "Gb",
    "Ab": "G#", "G#": "Ab",
    "Bb": "A#", "A#": "Bb",
  };

  // Create a map for quick highlight lookup (with enharmonic support)
  const highlightMap = useMemo(() => {
    const map = new Map<string, NoteHighlight>();
    highlightedNotes.forEach((item) => {
      const highlight = typeof item === "string"
        ? { note: item, role: "root" as const }
        : item;

      // Add the note itself
      map.set(highlight.note, highlight);

      // Also add enharmonic equivalent
      const noteName = highlight.note.replace(/\d+$/, "");
      const octave = highlight.note.match(/\d+$/)?.[0] || "";
      if (enharmonics[noteName]) {
        map.set(`${enharmonics[noteName]}${octave}`, highlight);
      }
    });
    return map;
  }, [highlightedNotes]);

  // Generate all keys for the specified octave range
  const keys = useMemo(() => {
    const allKeys: { note: string; isBlack: boolean }[] = [];

    for (let octave = startOctave; octave <= endOctave; octave++) {
      notes.forEach((note) => {
        const fullNote = `${note}${octave}`;
        const isBlack = blackNotes.includes(note);
        allKeys.push({ note: fullNote, isBlack });
      });
    }

    return allKeys;
  }, [startOctave, endOctave]);

  // Separate white and black keys for proper rendering
  const whiteKeys = keys.filter((k) => !k.isBlack);
  const blackKeys = keys.filter((k) => k.isBlack);

  return (
    <div
      data-testid="piano-keyboard"
      className={cn("relative inline-flex", className)}
      role="group"
      aria-label="Piano keyboard"
    >
      {/* White keys */}
      <div className="flex">
        {whiteKeys.map(({ note }) => (
          <Key
            key={note}
            note={note}
            isBlack={false}
            highlight={highlightMap.get(note)}
            showLabel={showLabels}
            onPress={() => onKeyPress?.(note)}
          />
        ))}
      </div>

      {/* Black keys overlay */}
      <div className="absolute top-0 left-0 flex">
        {keys.map(({ note, isBlack }, index) => {
          if (!isBlack) {
            // White key spacer - must match white key width
            const noteName = note.replace(/\d/, "");
            const nextNote = notes[(notes.indexOf(noteName) + 1) % 12];
            const hasBlackAfter = blackNotes.includes(nextNote);
            return (
              <div
                key={`spacer-${note}`}
                className={cn("w-11 sm:w-12", hasBlackAfter ? "" : "")}
              />
            );
          }

          return (
            <Key
              key={note}
              note={note}
              isBlack={true}
              highlight={highlightMap.get(note)}
              showLabel={showLabels}
              onPress={() => onKeyPress?.(note)}
            />
          );
        })}
      </div>
    </div>
  );
}
