"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Check, Search, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface RootsStepProps {
    onNext: (data: any) => void
    onBack: () => void
    initialData?: any
    availableInterests?: { id: string, name: string }[]
}

export function RootsStep({ onNext, onBack, initialData, availableInterests = [] }: RootsStepProps) {
    const [selected, setSelected] = useState<string[]>(initialData?.interests || [])
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

    const toggleInterest = (interestId: string) => {
        setSelected(prev =>
            prev.includes(interestId)
                ? prev.filter(i => i !== interestId)
                : [...prev, interestId]
        )
    }

    const removeInterest = (interestId: string) => {
        setSelected(prev => prev.filter(i => i !== interestId))
    }

    // Filter interests based on search query
    const filteredInterests = availableInterests.filter(interest =>
        interest.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Get selected interest names for display
    const selectedInterests = availableInterests.filter(i => selected.includes(i.id))

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-primary">Plant your roots</h2>
                <p className="text-muted-foreground">
                    What do you enjoy? Connect with neighbors who share your interests
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
                                placeholder="Search interests..."
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
                        {showDropdown && filteredInterests.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-popover border rounded-xl shadow-lg z-10">
                                {filteredInterests.map((interest) => {
                                    const isSelected = selected.includes(interest.id)
                                    return (
                                        <button
                                            key={interest.id}
                                            type="button"
                                            onClick={() => {
                                                toggleInterest(interest.id)
                                                setSearchQuery("")
                                            }}
                                            className={cn(
                                                "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between",
                                                isSelected && "bg-primary/5"
                                            )}
                                        >
                                            <span className={cn("text-sm", isSelected && "font-medium")}>
                                                {interest.name}
                                            </span>
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {showDropdown && searchQuery && filteredInterests.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-lg z-10 p-4 text-center text-sm text-muted-foreground">
                                No interests found matching "{searchQuery}"
                            </div>
                        )}
                    </div>

                    {/* Selected Interests Display */}
                    {selectedInterests.length > 0 && (
                        <div className="p-4 rounded-xl bg-muted/30 border">
                            <p className="text-sm font-medium text-muted-foreground mb-3">Interests</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedInterests.map(interest => (
                                    <Badge
                                        key={interest.id}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 gap-1"
                                    >
                                        {interest.name}
                                        <button
                                            type="button"
                                            onClick={() => removeInterest(interest.id)}
                                            className="ml-1 hover:text-primary-foreground/70"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onBack} className="flex-1 h-12">Back</Button>
                    <Button onClick={() => onNext({ interests: selected })} className="flex-1 h-12">Continue</Button>
                </div>
            </div>
        </div>
    )
}
