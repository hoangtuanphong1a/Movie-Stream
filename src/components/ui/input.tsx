import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-muted)] px-3 text-sm outline-none placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
