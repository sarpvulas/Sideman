"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { slideUpVariants } from "@/hooks";

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-full",
};

export function PageContainer({
  children,
  className,
  maxWidth = "xl",
}: PageContainerProps) {
  return (
    <motion.main
      className={cn(
        "min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8",
        maxWidthClasses[maxWidth],
        "mx-auto",
        className
      )}
      variants={slideUpVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.main>
  );
}
