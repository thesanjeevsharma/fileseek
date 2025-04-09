import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-sm hover:bg-blue-500 active:bg-blue-700 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-400 dark:active:bg-blue-600",
        destructive:
          "bg-red-500/20 text-red-400 hover:bg-red-500/30 active:bg-red-500/40 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40 dark:active:bg-red-900/50",
        outline:
          "border border-gray-800 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white active:bg-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50",
        secondary:
          "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white active:bg-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
        ghost:
          "text-gray-300 hover:bg-gray-800 hover:text-white active:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
        link:
          "text-blue-400 underline-offset-4 hover:text-blue-300 hover:underline dark:text-blue-400 dark:hover:text-blue-300",
        premium:
          "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-400 hover:to-purple-400 active:from-blue-600 active:to-purple-600",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
