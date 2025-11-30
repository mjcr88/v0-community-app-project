"use client"

import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface Skill {
    name: string
    open_to_requests: boolean
}

interface SkillsListProps {
    skills: Skill[]
    showOpenToRequests: boolean
}

export function SkillsList({ skills, showOpenToRequests }: SkillsListProps) {
    const hasAvailableSkills = showOpenToRequests && skills.some(s => s.open_to_requests)

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                    <div key={index} className="relative">
                        <Badge
                            variant="secondary"
                            className="pr-3 flex items-center gap-1.5"
                        >
                            {skill.name}
                            {showOpenToRequests && skill.open_to_requests && (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30">
                                    <Check className="h-3 w-3 text-green-700 dark:text-green-400 stroke-[3]" />
                                </span>
                            )}
                        </Badge>
                    </div>
                ))}
            </div>

            {hasAvailableSkills && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-500" />
                    Available to help
                </p>
            )}
        </div>
    )
}
