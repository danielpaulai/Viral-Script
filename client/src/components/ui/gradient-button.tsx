import * as React from "react"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "sm" | "lg"
  showArrow?: boolean
  showGlow?: boolean
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, size = "default", showArrow = true, showGlow = true, children, ...props }, ref) => {
    const sizeClass = size === "sm" ? "gradient-button-sm" : size === "lg" ? "gradient-button-lg" : ""
    
    return (
      <div className="gradient-button-wrapper">
        {showGlow && <div className="gradient-button-glow" />}
        <button
          className={cn("gradient-button", sizeClass, className)}
          ref={ref}
          {...props}
        >
          {children}
          {showArrow && <ArrowRight />}
        </button>
      </div>
    )
  }
)
GradientButton.displayName = "GradientButton"

export { GradientButton }
