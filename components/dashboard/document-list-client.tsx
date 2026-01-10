"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Inbox, CheckCircle2, Archive, FileText, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Database } from "@/types/supabase"
import { DocumentCard } from "@/components/dashboard/document-card"
import { DocumentEmptyState } from "@/components/dashboard/document-empty-state"

type Document = Database["public"]["Tables"]["documents"]["Row"] & { is_read?: boolean }

interface DocumentListClientProps {
    documents: Document[]
    slug: string
    userId: string
    tenantId: string
}

export function DocumentListClient({
    documents,
    slug,
    userId,
}: DocumentListClientProps) {
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState<string>("new")
    const [localDocuments, setLocalDocuments] = useState<Document[]>(documents)

    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Sync local state
    useEffect(() => {
        setLocalDocuments(documents)
    }, [documents])

    const handleMarkAsRead = (id: string) => {
        setLocalDocuments((prev) =>
            prev.map((d) =>
                d.id === id
                    ? { ...d, is_read: true }
                    : d
            )
        )
    }

    const categories = [
        { value: "regulation", label: "Regulations", icon: "📋" },
        { value: "financial", label: "Financial", icon: "💰" },
        { value: "construction", label: "Construction", icon: "🏗️" },
        { value: "hoa", label: "HOA", icon: "🏠" },
    ]

    const filteredDocuments = useMemo(() => {
        return localDocuments.filter((doc) => {
            const matchesSearch =
                search === "" ||
                doc.title.toLowerCase().includes(search.toLowerCase()) ||
                (doc.description && doc.description.toLowerCase().includes(search.toLowerCase()))

            const matchesCategory =
                selectedCategories.length === 0 ||
                (doc.category && selectedCategories.includes(doc.category))

            const isArchived = doc.status === "archived"
            const isRead = doc.is_read

            if (activeTab === "new") {
                return matchesSearch && matchesCategory && !isRead && !isArchived
            } else if (activeTab === "read") {
                return matchesSearch && matchesCategory && isRead && !isArchived
            } else {
                // archived
                return matchesSearch && matchesCategory && isArchived
            }
        })
    }, [localDocuments, search, activeTab, selectedCategories])

    const counts = useMemo(() => {
        // Base counts (ignoring category filter for global tab counts, or should they respect filter?
        // Usually tab counts show total items in that bucket. Let's keep it simple for now and show totals.)
        // But if I want to show filtered counts, I should apply category filter here too. 
        // Let's stick to totals for now as per typical UX, or maybe filtered? 
        // Let's use filtered counts to be helpful.
        const filter = (d: Document) => selectedCategories.length === 0 || (d.category && selectedCategories.includes(d.category))

        return {
            new: localDocuments.filter((d) => !d.is_read && d.status !== "archived" && filter(d)).length,
            read: localDocuments.filter((d) => d.is_read && d.status !== "archived" && filter(d)).length,
            archived: localDocuments.filter((d) => d.status === "archived" && filter(d)).length,
        }
    }, [localDocuments, selectedCategories])

    const tabs = [
        { value: "new", label: "New", count: counts.new, icon: Inbox },
        { value: "read", label: "Read", count: counts.read, icon: CheckCircle2 },
        { value: "archived", label: "Archived", count: counts.archived, icon: Archive },
    ]

    const handleCategoryToggle = (value: string) => {
        setSelectedCategories((prev) =>
            prev.includes(value)
                ? prev.filter((c) => c !== value)
                : [...prev, value]
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 pb-12">
            {/* Header Section */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    Community Documents
                </h1>
                <p className="text-muted-foreground text-lg">
                    Access regulations, financial reports, and other official files.
                </p>
            </div>

            {/* Search & Tabs Section */}
            <div className="space-y-4">
                {/* Tabs - Moved above Search */}
                <div className="flex flex-wrap gap-2 items-center">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                        <TabsList className="bg-muted/30 p-1 rounded-full h-auto flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-1">
                            {tabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="rounded-full px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all whitespace-nowrap flex-none"
                                >
                                    <span className="flex items-center gap-2">
                                        <tab.icon className="h-4 w-4" />
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "px-1.5 py-0.5 text-[10px] h-auto min-w-[1.25rem] justify-center",
                                                    activeTab === tab.value
                                                        ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                                                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                                                )}
                                            >
                                                {tab.count}
                                            </Badge>
                                        )}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Search - Left Aligned */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-background border-input focus:bg-background transition-colors"
                    />
                </div>

                {/* Category Filter Card */}
                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 h-20 w-32 hover:shadow-md",
                            isFilterOpen
                                ? "bg-primary/10 border-primary text-primary ring-1 ring-primary shadow-sm"
                                : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <Tag className={cn("w-5 h-5 mb-1.5", isFilterOpen ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-xs font-medium text-center leading-tight">Categories</span>
                    </button>

                    {/* Active Filter Chips */}
                    {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Active filters:</span>
                            {selectedCategories.map((catValue) => {
                                const category = categories.find((c) => c.value === catValue)
                                return (
                                    <Badge
                                        key={catValue}
                                        variant="secondary"
                                        className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => handleCategoryToggle(catValue)}
                                    >
                                        <span className="text-xs">{category?.icon}</span> {category?.label}
                                        <span className="ml-1">×</span>
                                    </Badge>
                                )
                            })}
                            <Button variant="ghost" size="sm" onClick={() => setSelectedCategories([])} className="h-6 px-2 text-xs">
                                Clear all
                            </Button>
                        </div>
                    )}

                    {isFilterOpen && (
                        <Card className="border-2 border-muted/50">
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    <h4 className="font-medium text-sm">Select Categories</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                        {categories.map((category) => (
                                            <div key={category.value} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`category-${category.value}`}
                                                    checked={selectedCategories.includes(category.value)}
                                                    onCheckedChange={() => handleCategoryToggle(category.value)}
                                                />
                                                <Label
                                                    htmlFor={`category-${category.value}`}
                                                    className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                                                >
                                                    <span className="text-base leading-none">{category.icon}</span>
                                                    {category.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border"></div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {filteredDocuments.length} {filteredDocuments.length === 1 ? 'Document' : 'Documents'}
                </h2>
                <div className="h-px flex-1 bg-border"></div>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {filteredDocuments.length > 0 ? (
                    <div className="grid gap-4">
                        {filteredDocuments.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                slug={slug}
                                onMarkAsRead={handleMarkAsRead}
                            />
                        ))}
                    </div>
                ) : (
                    <DocumentEmptyState
                        type={search || selectedCategories.length > 0 ? "search" : (activeTab as "new" | "read" | "archived")}
                        onClearFilters={() => {
                            setSearch("")
                            setSelectedCategories([])
                        }}
                    />
                )}
            </div>
        </div>
    )
}
