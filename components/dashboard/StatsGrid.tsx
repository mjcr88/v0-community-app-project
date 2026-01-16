"use client"

import { useState } from "react"
import useSWR from "swr"
import { StatCard, StatConfig } from "./StatCard"
import { EditStatModal, AvailableStat } from "./EditStatModal"
import { Settings2 } from "lucide-react"
import { DashboardAnalytics } from "@/lib/analytics"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface StatsResponse {
    stats: StatConfig[]
    config: string[]
    available: AvailableStat[]
    scope: "tenant" | "neighborhood"
}

export function StatsGrid() {
    const { data, mutate, isLoading } = useSWR<StatsResponse>(
        "/api/dashboard/stats",
        fetcher
    )
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const handleSaveStats = async (selectedStats: string[], scope: "tenant" | "neighborhood") => {
        try {
            await fetch("/api/dashboard/stats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stats: selectedStats, scope }),
            })
            DashboardAnalytics.statsSaved(selectedStats, scope)
            mutate() // Refresh data
        } catch (error) {
            console.error("Failed to save stats", error)
        }
    }

    const handleOpenModal = () => {
        DashboardAnalytics.statsModalOpened()
        setIsEditModalOpen(true)
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
                ))}
            </div>
        )
    }

    if (!data || !data.stats) return null

    const stats = data.stats || []
    const config = data.config || []

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats
                    .sort((a, b) => {
                        const indexA = config.indexOf(a.id)
                        const indexB = config.indexOf(b.id)
                        return indexA - indexB
                    })
                    .slice(0, 4)
                    .map((stat) => (
                        <StatCard
                            key={stat.id}
                            stat={stat}
                            isEditing={true}
                            onEdit={handleOpenModal}
                        />
                    ))}
                {/* Fill empty slots if less than 4 selected */}
                {Array.from({ length: Math.max(0, 4 - stats.length) }).map((_, i) => (
                    <div
                        key={`empty-${i}`}
                        className="h-full min-h-[100px] md:min-h-[120px] rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-all"
                        onClick={handleOpenModal}
                    >
                        <div className="text-center">
                            <Settings2 className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground font-medium">Add Stat</span>
                        </div>
                    </div>
                ))}
            </div>

            <EditStatModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                currentStats={config}
                availableStats={data.available || []}
                currentScope={data.scope || "tenant"}
                onSave={handleSaveStats}
            />
        </>
    )
}
