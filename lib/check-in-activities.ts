import {
  Coffee,
  Laptop,
  Users,
  Dumbbell,
  Gamepad2,
  UtensilsCrossed,
  Armchair,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react"

export interface CheckInActivity {
  value: string
  label: string
  icon: LucideIcon // Changed from string to actual Lucide icon component
}

export const CHECK_IN_ACTIVITIES: CheckInActivity[] = [
  { value: "coffee", label: "Coffee", icon: Coffee },
  { value: "working", label: "Working", icon: Laptop },
  { value: "socializing", label: "Socializing", icon: Users },
  { value: "exercise", label: "Exercise", icon: Dumbbell },
  { value: "games", label: "Games", icon: Gamepad2 },
  { value: "meal", label: "Meal", icon: UtensilsCrossed },
  { value: "relaxing", label: "Relaxing", icon: Armchair },
  { value: "other", label: "Other", icon: MoreHorizontal },
]

export function getActivityIcon(activityValue: string): LucideIcon {
  const activity = CHECK_IN_ACTIVITIES.find((a) => a.value === activityValue)
  return activity?.icon || MoreHorizontal
}

export function getActivityLabel(activityValue: string): string {
  const activity = CHECK_IN_ACTIVITIES.find((a) => a.value === activityValue)
  return activity?.label || activityValue
}
