import React from "react";
import { cn } from "@/lib/utils";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}) => {
  return (
    <div className={cn("relative p-[4px] group", containerClassName)}>
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-purple-500 to-[var(--primary)] rounded-[22px] z-[1] opacity-70 group-hover:opacity-100 blur-xl transition duration-500",
          animate && "animate-pulse"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-purple-500 to-[var(--primary)] rounded-[22px] z-[1] opacity-100",
          animate && "animate-pulse"
        )}
      />
      <div className={cn("relative z-[2] bg-zinc-900 rounded-[20px]", className)}>
        {children}
      </div>
    </div>
  );
};
