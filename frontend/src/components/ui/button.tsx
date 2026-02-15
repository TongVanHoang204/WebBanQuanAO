import * as React from "react"
import { clsx, type ClassValue } from "clsx"

function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
        default: "bg-primary-600 text-white shadow hover:bg-primary-700",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline: "border border-secondary-200 bg-white shadow-sm hover:bg-secondary-100 hover:text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:hover:bg-secondary-700 dark:text-secondary-100",
        secondary: "bg-secondary-100 text-secondary-900 shadow-sm hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-600",
        ghost: "hover:bg-secondary-100 hover:text-secondary-900 dark:hover:bg-secondary-700 dark:text-secondary-100",
        link: "text-primary-600 underline-offset-4 hover:underline",
    }
    
    const sizes = {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
