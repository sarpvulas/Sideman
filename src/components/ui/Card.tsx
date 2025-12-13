"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";
import { useAnimation, fadeInVariants } from "@/hooks";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  animate?: boolean;
}

const variantClasses = {
  default: "bg-primary-800 border border-primary-700",
  elevated: "bg-primary-800 shadow-lg shadow-black/20",
  outlined: "bg-transparent border-2 border-primary-600",
};

const paddingClasses = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      animate = true,
      className,
      ...props
    },
    ref
  ) => {
    const { variants, shouldAnimate } = useAnimation(fadeInVariants);

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-xl",
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        variants={animate ? variants : undefined}
        initial={animate && shouldAnimate ? "initial" : undefined}
        animate={animate && shouldAnimate ? "animate" : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";
