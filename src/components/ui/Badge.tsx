import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-white/[0.06] text-slate-300 border border-white/[0.06]",
  success: "bg-pitch-500/10 text-pitch-400 border border-pitch-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border border-red-500/20",
  info: "bg-brand-500/10 text-brand-400 border border-brand-500/20",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";
