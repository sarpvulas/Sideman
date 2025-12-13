"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Image, X, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui";

export interface ScoreUploaderProps {
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

const ACCEPTED_TYPES = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
};

export function ScoreUploader({
  onUpload,
  isUploading = false,
  accept = ".pdf,.png,.jpg,.jpeg",
  maxSize = 10,
  className,
}: ScoreUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
        return `Invalid file type. Please upload ${Object.values(ACCEPTED_TYPES).join(", ")}`;
      }
      if (file.size > maxSize * 1024 * 1024) {
        return `File too large. Maximum size is ${maxSize}MB`;
      }
      return null;
    },
    [maxSize]
  );

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setSelectedFile(file);
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }, [selectedFile, onUpload]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  return (
    <div className={cn("w-full max-w-xl mx-auto", className)}>
      <motion.div
        data-testid="upload-zone"
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors",
          isDragging
            ? "border-accent-teal bg-accent-teal/10"
            : "border-primary-600 hover:border-primary-500",
          error && "border-accent-coral"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? "var(--color-accent-teal)" : undefined,
        }}
      >
        {/* Only show file input overlay when no file is selected */}
        {!selectedFile && (
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
            aria-label="Upload sheet music file"
          />
        )}

        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-3">
                {selectedFile.type === "application/pdf" ? (
                  <FileText className="w-12 h-12 text-accent-coral" />
                ) : (
                  <Image className="w-12 h-12 text-accent-teal" />
                )}
                <div className="text-left">
                  <p className="font-medium text-primary-100 truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-primary-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  className="p-1 hover:bg-primary-700 rounded-full transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-5 h-5 text-primary-400" />
                </button>
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                loading={isUploading}
                disabled={isUploading}
                data-testid="upload-button"
              >
                {isUploading ? "Analyzing..." : "Analyze Score"}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <motion.div
                  className="w-16 h-16 rounded-full bg-primary-700 flex items-center justify-center"
                  animate={
                    isDragging
                      ? { scale: 1.1, backgroundColor: "var(--color-accent-teal)" }
                      : { scale: 1 }
                  }
                >
                  <Upload className="w-8 h-8 text-primary-300" />
                </motion.div>
              </div>

              <div>
                <p className="text-lg font-medium text-primary-100">
                  Drag & drop your sheet music
                </p>
                <p className="text-sm text-primary-400 mt-1">
                  or click to browse
                </p>
              </div>

              <div className="flex justify-center gap-2">
                <span className="px-2 py-1 bg-primary-700 rounded text-xs text-primary-300">
                  PDF
                </span>
                <span className="px-2 py-1 bg-primary-700 rounded text-xs text-primary-300">
                  PNG
                </span>
                <span className="px-2 py-1 bg-primary-700 rounded text-xs text-primary-300">
                  JPEG
                </span>
              </div>

              <p className="text-xs text-primary-500">Max file size: {maxSize}MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-3 bg-accent-coral/20 border border-accent-coral/50 rounded-lg"
          >
            <p className="text-sm text-accent-coral">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
