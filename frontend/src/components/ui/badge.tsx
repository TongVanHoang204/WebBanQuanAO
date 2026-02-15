import * as React from "react"
import { clsx, type ClassValue } from "clsx"

function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default:
      "border-transparent bg-primary-600 text-white shadow hover:bg-primary-700",
    secondary:
      "border-transparent bg-secondary-100 text-secondary-900 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-100",
    destructive:
      "border-transparent bg-red-500 text-white shadow hover:bg-red-600",
    outline: "text-secondary-900 dark:text-secondary-100 border border-secondary-200 dark:border-secondary-700",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
