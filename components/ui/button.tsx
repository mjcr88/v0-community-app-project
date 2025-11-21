import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { getButtonStateClasses, type ComponentState, type ButtonVariant } from '@/lib/design-system/component-states'

const buttonVariants = cva(
  "", // Base classes handled by getButtonStateClasses
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: "",
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  state?: ComponentState
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size, state = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    // Map cva variant names to getButtonStateClasses variant names if they differ
    // In this case, 'default' in cva maps to 'primary' in getButtonStateClasses
    const designSystemVariant = (variant === 'default' ? 'primary' : variant) as ButtonVariant

    const baseAndVariantClasses = getButtonStateClasses(designSystemVariant, state)
    const sizeClasses = buttonVariants({ variant, size, className })

    return (
      <Comp
        className={cn(baseAndVariantClasses, sizeClasses)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
