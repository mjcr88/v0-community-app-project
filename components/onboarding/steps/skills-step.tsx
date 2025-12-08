"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Check, Search, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface SkillsStepProps {
    onNext: (data: any) => void
    onBack: () => void
    initialData?: any
    availableSkills?: { id: string, name: string, description: string }[]
}

interface SkillSelection {
    id: string
    openToRequests: boolean
}

export function SkillsStep({ onNext, onBack, initialData, availableSkills = [] }: SkillsStepProps) {
    // Initialize with existing skills from profile
    const [selected, setSelected] = useState<SkillSelection[]>(() => {
        if (initialData?.skills && Array.isArray(initialData.skills)) {
            // If skills is array of objects with id and openToRequests
            if (initialData.skills.length > 0 && typeof initialData.skills[0] === 'object') {
                return initialData.skills
            }
            // If skills is array of IDs, convert to objects
            return initialData.skills.map((id: string) => ({ id, openToRequests: false }))
        }
        return []
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [showDropdown, setShowDropdown] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const toggleSkill = (skillId: string) => {
        const exists = selected.find(s => s.id === skillId)
        if (exists) {
            setSelected(prev => prev.filter(s => s.id !== skillId))
        } else {
            setSelected(prev => [...prev, { id: skillId, openToRequests: false }])
        }
    }

    const toggleOpenToRequests = (skillId: string) => {
        setSelected(prev =>
            prev.map(s =>
                s.id === skillId
                    ? { ...s, openToRequests: !s.openToRequests }
                    : s
            )
        )
    }

    const removeSkill = (skillId: string) => {
        setSelected(prev => prev.filter(s => s.id !== skillId))
    }

    // Filter skills based on search query
    const filteredSkills = availableSkills.filter(skill =>
        skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Get selected skill objects for display
    const selectedSkills = selected.map(s => {
        const skill = availableSkills.find(sk => sk.id === s.id)
        return skill ? { ...skill, openToRequests: s.openToRequests } : null
    }).filter(Boolean)

    const handleNext = () => {
        onNext({ skills: selected })
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-primary">Share your gifts</h2>
                <p className="text-muted-foreground">
                    What skills can you share with the community?
                </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
                <div className="space-y-4">
                    {/* Search Input with Dropdown */}
                    <div className="relative" ref={searchRef}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search skills..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setShowDropdown(true)
                                }}
                                onFocus={() => setShowDropdown(true)}
                                className="pl-9 h-12"
                            />
                        </div>

                        {/* Dropdown */}
                        {showDropdown && filteredSkills.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-popover border rounded-xl shadow-lg z-10">
                                {filteredSkills.map((skill) => {
                                    const isSelected = selected.some(s => s.id === skill.id)
                                    return (
                                        <button
                                            key={skill.id}
                                            type="button"
                                            onClick={() => {
                                                toggleSkill(skill.id)
                                                setSearchQuery("")
                                            }}
                                            className={cn(
                                                "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between",
                                                isSelected && "bg-primary/5"
                                            )}
                                        >
                                            <span className={cn("text-sm", isSelected && "font-medium")}>
                                                {skill.name}
                                            </span>
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {showDropdown && searchQuery && filteredSkills.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-lg z-10 p-4 text-center text-sm text-muted-foreground">
                                No skills found matching "{searchQuery}"
                            </div>
                        )}
                    </div>

                    {/* Selected Skills Display */}
                    {selectedSkills.length > 0 && (
                        <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">Selected Skills</p>
                            </div>

                            <div className="space-y-2">
                                {selectedSkills.map(skill => {
                                    if (!skill) return null
                                    const skillSelection = selected.find(s => s.id === skill.id)
                                    const isOpen = skillSelection?.openToRequests || false

                                    return (
                                        <div
                                            key={skill.id}
                                            className="flex items-center justify-between p-3 bg-card rounded-lg border"
                                        >
                                            <span className="font-medium text-sm">{skill.name}</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleOpenToRequests(skill.id)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                                                        isOpen
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    {isOpen ? "Open to Help" : "Not Open"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(skill.id)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <p className="text-xs text-muted-foreground/80 italic pt-1 border-t border-border/50 mt-2">
                                "Open to help" lets neighbors know they can ask you about these topics.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="ghost" onClick={onBack} className="flex-1 h-12">Back</Button>
                    <Button onClick={handleNext} className="flex-1 h-12">Continue</Button>
                </div>
            </div>
        </div>
    )
}
