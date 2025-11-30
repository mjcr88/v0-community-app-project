"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/ecovilla/dashboard/StatCard"
import { EditStatModal } from "@/components/ecovilla/dashboard/EditStatModal"

interface StatData {
    id: string
    label: string
    value: number
    scope: "Personal" | "Neighborhood" | "Community"
    icon: string
    color: string
    description: string
}

export default function StatsTestPage() {
    const [stats, setStats] = useState<StatData[]>([])
    const [loading, setLoading] = useState(true)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedStatIndex, setSelectedStatIndex] = useState<number | null>(null)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/dashboard/stats")
            const data = await response.json()
            console.log("API Response:", data)
            console.log("Stats array:", data.stats)
            console.log("Stats length:", data.stats?.length)
            if (data.stats) {
                setStats(data.stats)
            }
        } catch (error) {
            console.error("Error fetching stats:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditClick = (index: number) => {
        setSelectedStatIndex(index)
        setEditModalOpen(true)
    }

    const handleSaveConfig = async (newConfig: string[]) => {
        try {
            const response = await fetch("/api/dashboard/stats/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config: newConfig })
            })

            if (response.ok) {
                // Reload stats
                await fetchStats()
                setEditModalOpen(false)
            }
        } catch (error) {
            console.error("Error saving stats config:", error)
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Dashboard Stats Test</h1>
                    <p>Loading stats...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Dashboard Stats Test</h1>
                    <p className="text-muted-foreground">
                        Testing customizable stat cards. Hover over cards to see edit button, click to customize.
                    </p>
                    <p className="text-sm mt-2 text-orange-600">
                        Stats loaded: {stats.length} {stats.length === 0 && "(No stats returned from API)"}
                    </p>
                </div>

                {/* Mobile Layout: 2x2 Grid */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Mobile Layout (2x2)</h2>
                    <div className="grid grid-cols-2 gap-3 lg:hidden">
                        {stats.map((stat, index) => (
                            <StatCard
                                key={stat.id}
                                value={stat.value}
                                label={stat.label}
                                scope={stat.scope}
                                onEdit={() => handleEditClick(index)}
                            />
                        ))}
                    </div>
                </div>

                {/* Desktop Layout: 1x4 Row */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Desktop Layout (1x4)</h2>
                    <div className="hidden lg:grid lg:grid-cols-4 gap-3">
                        {stats.map((stat, index) => (
                            <StatCard
                                key={stat.id}
                                value={stat.value}
                                label={stat.label}
                                scope={stat.scope}
                                onEdit={() => handleEditClick(index)}
                            />
                        ))}
                    </div>
                </div>

                {/* Show both for testing purposes */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Combined View (Testing)</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {stats.map((stat, index) => (
                            <StatCard
                                key={stat.id}
                                value={stat.value}
                                label={stat.label}
                                scope={stat.scope}
                                onEdit={() => handleEditClick(index)}
                            />
                        ))}
                    </div>
                </div>

                {/* Stats Details */}
                <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Current Stats Configuration:</h3>
                    <ul className="space-y-1 text-sm">
                        {stats.map((stat, index) => (
                            <li key={stat.id}>
                                {index + 1}. <strong>{stat.label}</strong> ({stat.scope}) - {stat.value} - {stat.description}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Edit Modal */}
            <EditStatModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                currentConfig={stats.map(s => s.id)}
                onSave={handleSaveConfig}
            />
        </div>
    )
}
