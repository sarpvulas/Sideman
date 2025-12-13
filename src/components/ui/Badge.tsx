"use client";

import { cn } from "@/utils/cn";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  className?: string;
}

const variantClasses = {
  default: "bg-primary-700 text-primary-200",
  success: "bg-accent-gold/20 text-accent-gold",
  warning: "bg-accent-amber/20 text-accent-amber",
  error: "bg-accent-coral/20 text-accent-coral",
  info: "bg-accent-teal/20 text-accent-teal",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
