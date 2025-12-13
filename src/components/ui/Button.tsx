"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useAnimation, buttonVariants } from "@/hooks";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const variantClasses = {
  primary:
    "bg-accent-gold text-primary-900 hover:bg-accent-gold-glow focus:ring-accent-gold",
  secondary:
    "bg-primary-700 text-primary-100 border border-primary-600 hover:bg-primary-600 focus:ring-primary-400",
  ghost:
    "bg-transparent text-primary-300 hover:bg-primary-800 hover:text-primary-100 focus:ring-primary-400",
  danger:
    "bg-accent-coral text-white hover:bg-accent-coral-glow focus:ring-accent-coral",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className,
      ...props
    },
    ref
  ) => {
    const { variants, shouldAnimate } = useAnimation(buttonVariants);

    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold rounded-lg",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        variants={variants}
        initial="idle"
        whileHover={!disabled && shouldAnimate ? "hover" : undefined}
        whileTap={!disabled && shouldAnimate ? "tap" : undefined}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <Loader2
            className="animate-spin"
            size={size === "sm" ? 16 : size === "lg" ? 24 : 20}
            data-testid="spinner"
          />
        )}
        {!loading && leftIcon}
        <span>{children}</span>
        {!loading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
