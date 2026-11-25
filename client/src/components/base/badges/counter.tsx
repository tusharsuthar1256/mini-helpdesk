import type { HTMLAttributes, Ref } from "react";
import { cx, sortCx } from "@/utils/cx";

export type CounterColor = "primary" | "neutral";

export interface CounterProps extends HTMLAttributes<HTMLSpanElement> {
  color?: CounterColor;
  ref?: Ref<HTMLSpanElement>;
}

const styles = sortCx({
  base: "inline-flex items-center justify-center rounded-sm px-1 py-px text-caption-1-semibold tracking-normal whitespace-nowrap",
  color: {
    primary: "bg-accent-400 text-white",
    neutral: "bg-badge-neutral-background text-text-secondary",
  },
});

export function Counter({ color = "neutral", className, ref, ...props }: CounterProps) {
  return (
    <span
      ref={ref}
      className={cx(styles.base, styles.color[color], className)}
      {...props}
    />
  );
}
