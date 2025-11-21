import { cn } from "@/lib/utils"

export type ComponentState = 'default' | 'hover' | 'focused' | 'active' | 'disabled' | 'loading' | 'error' | 'success'
export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline' | 'link'

/**
 * Returns className string for button states based on variant and state.
 * 
 * @param variant - The visual style of the button
 * @param state - The current interactive state
 * @param className - Additional classes to merge
 */
export function getButtonStateClasses(
    variant: ButtonVariant = 'primary',
    state: ComponentState = 'default',
    className?: string
): string {
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"

    const variantClasses = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
        link: "text-primary underline-offset-4 hover:underline",
    }

    // State overrides (if needed beyond standard hover/focus pseudo-classes)
    // Note: Tailwind handles most state via modifiers (hover:, focus:), so this function 
    // primarily maps variants. Specific state overrides can be added here if logic requires it.

    return cn(baseClasses, variantClasses[variant], className)
}

/**
 * Returns className string for input states.
 * 
 * @param state - The current interactive state
 * @param hasError - Whether the input has a validation error
 * @param className - Additional classes to merge
 */
export function getInputStateClasses(
    state: ComponentState = 'default',
    hasError: boolean = false,
    className?: string
): string {
    const baseClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

    const errorClasses = hasError ? "border-destructive focus-visible:ring-destructive" : ""
    const successClasses = state === 'success' ? "border-success focus-visible:ring-success" : ""

    return cn(baseClasses, errorClasses, successClasses, className)
}

/**
 * Returns className string for card states.
 * 
 * @param isInteractive - Whether the card is clickable
 * @param state - The current interactive state
 * @param className - Additional classes to merge
 */
export function getCardStateClasses(
    isInteractive: boolean = false,
    state: ComponentState = 'default',
    className?: string
): string {
    const baseClasses = "rounded-lg border bg-card text-card-foreground shadow-sm"

    const interactiveClasses = isInteractive
        ? "cursor-pointer transition-all hover:shadow-md active:scale-[0.99]"
        : ""

    return cn(baseClasses, interactiveClasses, className)
}
