"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Users, MapPin, Lightbulb, Wrench, Home, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ResidentCard } from "@/components/directory/ResidentCard"
import { FamilyCard } from "@/components/directory/FamilyCard"
import { DirectoryEmptyState } from "@/components/directory/DirectoryEmptyState"
import { MultiSelect } from "@/components/ui/multi-select"
import { ListCard } from "@/components/directory/ListCard"
import { ListDetailModal } from "@/components/directory/ListDetailModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createNeighborList } from "@/app/actions/neighbor-lists"

interface ResidentWithRelations {
    id: string
    first_name: string | null
    last_name: string | null
    [key: string]: any
}

interface FamilyUnitWithRelations {
    id: string
    name: string
    [key: string]: any
}

interface NeighboursPageClientProps {
    residents: ResidentWithRelations[]
    families: FamilyUnitWithRelations[]
    neighborhoods: Array<{ id: string; name: string }>
    allInterests: Array<{ id: string; name: string }>
    neighborLists: any[]
    tenantSlug: string
    currentUserFamilyId: string | null
    currentTenantId: string
    isTenantAdmin?: boolean
}

type FilterSection = "neighborhood" | "lot" | "interests" | "skills" | null

const RESIDENTS_PER_PAGE = 10

export function NeighboursPageClient({
    residents,
    families,
    neighborhoods,
    allInterests,
    neighborLists,
    tenantSlug,
    currentUserFamilyId,
    currentTenantId,
    isTenantAdmin = false,
}: NeighboursPageClientProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<"residents" | "families" | "lists">("residents")
    const [search, setSearch] = useState("")

    // List Creation State
    const [createListOpen, setCreateListOpen] = useState(false)
    const [newListLoading, setNewListLoading] = useState(false)
    const [newListName, setNewListName] = useState("")
    const [newListEmoji, setNewListEmoji] = useState("📝")
    const [newListDesc, setNewListDesc] = useState("")
    const [newListShared, setNewListShared] = useState(false)

    // List Detail State
    const [selectedList, setSelectedList] = useState<any>(null)

    const onCreateList = async () => {
        if (!newListName.trim()) return
        setNewListLoading(true)
        try {
            const res = await createNeighborList(currentTenantId, {
                name: newListName,
                emoji: newListEmoji,
                description: newListDesc,
                is_shared: newListShared
            })
            if (res.success) {
                toast.success("List created")
                setCreateListOpen(false)
                setNewListName("")
                setNewListDesc("")
                setNewListShared(false)
                router.refresh()
            } else {
                toast.error("Failed to create list")
            }
        } catch (e) {
            console.error(e)
            toast.error("Error creating list")
        } finally {
            setNewListLoading(false)
        }
    }

    const [activeFilter, setActiveFilter] = useState<FilterSection>(null)
    const [residentPage, setResidentPage] = useState(1)
    const [familyPage, setFamilyPage] = useState(1)

    // Filter states - now arrays for multi-select
    const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [selectedSkills, setSelectedSkills] = useState<string[]>([])
    const [selectedLots, setSelectedLots] = useState<string[]>([])

    // Extract unique skills and lots from residents
    const uniqueSkills = useMemo(() => {
        const skills = new Set<string>()
        residents.forEach((resident) => {
            if (Array.isArray(resident.user_skills)) {
                resident.user_skills.forEach((us: any) => {
                    if (us.skills?.name) skills.add(us.skills.name)
                })
            }
        })
        return Array.from(skills).sort()
    }, [residents])

    const uniqueLots = useMemo(() => {
        const lots = new Set<string>()
        residents.forEach((resident) => {
            if (resident.lots?.lot_number) lots.add(resident.lots.lot_number)
        })
        return Array.from(lots).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    }, [residents])

    // Filter residents
    const filteredResidents = useMemo(() => {
        return residents.filter((resident) => {
            // Search filter
            const searchLower = search.toLowerCase()
            const matchesSearch =
                search === "" ||
                `${resident.first_name ?? ""} ${resident.last_name ?? ""}`.toLowerCase().includes(searchLower) ||
                resident.lots?.lot_number?.toLowerCase().includes(searchLower) ||
                resident.lots?.neighborhoods?.name?.toLowerCase().includes(searchLower) ||
                (Array.isArray(resident.user_interests) &&
                    resident.user_interests.some((ui: any) => ui.interests?.name?.toLowerCase().includes(searchLower))) ||
                (Array.isArray(resident.user_skills) &&
                    resident.user_skills.some((us: any) => us.skills?.name?.toLowerCase().includes(searchLower)))

            // Neighborhood filter - match any selected
            const matchesNeighborhood =
                selectedNeighborhoods.length === 0 ||
                selectedNeighborhoods.includes(resident.lots?.neighborhoods?.name || "")

            // Lot filter - match any selected
            const matchesLot =
                selectedLots.length === 0 ||
                selectedLots.includes(resident.lots?.lot_number || "")

            // Interest filter - match any selected
            const matchesInterest =
                selectedInterests.length === 0 ||
                (Array.isArray(resident.user_interests) &&
                    resident.user_interests.some((ui: any) => selectedInterests.includes(ui.interests?.name)))

            // Skill filter - match any selected
            const matchesSkill =
                selectedSkills.length === 0 ||
                (Array.isArray(resident.user_skills) &&
                    resident.user_skills.some((us: any) => selectedSkills.includes(us.skills?.name)))

            return matchesSearch && matchesNeighborhood && matchesLot && matchesInterest && matchesSkill
        })
    }, [residents, search, selectedNeighborhoods, selectedLots, selectedInterests, selectedSkills])

    // Filter families
    const filteredFamilies = useMemo(() => {
        return families.filter((family) => {
            const searchLower = search.toLowerCase()
            const matchesSearch =
                search === "" ||
                family.name.toLowerCase().includes(searchLower) ||
                (Array.isArray(family.users) &&
                    family.users.some((user: any) =>
                        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower)
                    ))

            const matchesNeighborhood =
                selectedNeighborhoods.length === 0 ||
                (Array.isArray(family.users) &&
                    family.users.some(
                        (user: any) => selectedNeighborhoods.includes(user.lots?.neighborhoods?.name || "")
                    ))

            return matchesSearch && matchesNeighborhood
        })
    }, [families, search, selectedNeighborhoods])

    // Filter lists
    const filteredLists = useMemo(() => {
        return neighborLists.filter((list) =>
            list.name.toLowerCase().includes(search.toLowerCase())
        )
    }, [neighborLists, search])

    // Paginate results
    const paginatedResidents = filteredResidents.slice(0, residentPage * RESIDENTS_PER_PAGE)
    const paginatedFamilies = filteredFamilies.slice(0, familyPage * RESIDENTS_PER_PAGE)

    const hasMoreResidents = filteredResidents.length > paginatedResidents.length
    const hasMoreFamilies = filteredFamilies.length > paginatedFamilies.length

    // Count active filters
    const activeFilterCount =
        selectedNeighborhoods.length +
        selectedInterests.length +
        selectedSkills.length +
        selectedLots.length

    const clearAllFilters = () => {
        setSelectedNeighborhoods([])
        setSelectedInterests([])
        setSelectedSkills([])
        setSelectedLots([])
        setActiveFilter(null)
    }

    const filterSections = [
        { id: "neighborhood" as const, label: "Neighborhood", icon: MapPin },
        { id: "lot" as const, label: "Lot", icon: Home },
        { id: "interests" as const, label: "Interests", icon: Lightbulb },
        { id: "skills" as const, label: "Skills", icon: Wrench },
    ]

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* List Detail Modal */}
            {selectedList && (
                <ListDetailModal
                    list={selectedList}
                    open={!!selectedList}
                    onOpenChange={(open) => !open && setSelectedList(null)}
                    allResidents={residents}
                />
            )}

            {/* Create List Dialog */}
            <Dialog open={createListOpen} onOpenChange={setCreateListOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New List</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex gap-4">
                            <EmojiPicker selectedEmoji={newListEmoji} onEmojiSelect={setNewListEmoji} />
                            <Input
                                placeholder="List Name"
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                            />
                        </div>
                        <Textarea
                            placeholder="Description (optional)"
                            value={newListDesc}
                            onChange={e => setNewListDesc(e.target.value)}
                        />
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="new-shared">Share with family</Label>
                            <Switch id="new-shared" checked={newListShared} onCheckedChange={setNewListShared} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateListOpen(false)}>Cancel</Button>
                        <Button onClick={onCreateList} disabled={newListLoading || !newListName.trim()}>
                            {newListLoading ? "Creating..." : "Create List"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Neighbours</h1>
                    <p className="text-muted-foreground">Connect with other residents in your community</p>
                </div>
                {activeTab === "lists" && (
                    <Button onClick={() => setCreateListOpen(true)} className="md:self-start">
                        <Plus className="h-4 w-4 mr-2" />
                        Create List
                    </Button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <div className="w-full max-w-md">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-full h-auto">
                        <TabsTrigger
                            value="residents"
                            className="rounded-full flex items-center justify-center py-2 text-xs sm:text-sm border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Residents
                                {filteredResidents.length > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "px-1 py-0.5 sm:px-1.5 text-[9px] sm:text-[10px] h-auto min-w-[1rem] sm:min-w-[1.25rem] justify-center",
                                            activeTab === "residents"
                                                ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                    >
                                        {filteredResidents.length}
                                    </Badge>
                                )}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="families"
                            className="rounded-full flex items-center justify-center py-2 text-xs sm:text-sm border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Households
                                {filteredFamilies.length > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "px-1 py-0.5 sm:px-1.5 text-[9px] sm:text-[10px] h-auto min-w-[1rem] sm:min-w-[1.25rem] justify-center",
                                            activeTab === "families"
                                                ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                    >
                                        {filteredFamilies.length}
                                    </Badge>
                                )}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="lists"
                            className="rounded-full flex items-center justify-center py-2 text-xs sm:text-sm border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            <span className="flex items-center justify-center gap-2">
                                My Lists
                                {filteredLists.length > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "px-1 py-0.5 sm:px-1.5 text-[9px] sm:text-[10px] h-auto min-w-[1rem] sm:min-w-[1.25rem] justify-center",
                                            activeTab === "lists"
                                                ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                    >
                                        {filteredLists.length}
                                    </Badge>
                                )}
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </div>
            </Tabs>

            {/* Filter Triggers - Only show for residents tab */}
            {activeTab === "residents" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {filterSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveFilter(activeFilter === section.id ? null : section.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 h-20 w-full hover:shadow-md",
                                    activeFilter === section.id
                                        ? "bg-primary/10 border-primary text-primary ring-1 ring-primary shadow-sm"
                                        : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <section.icon className={cn("w-5 h-5 mb-1.5", activeFilter === section.id ? "text-primary" : "text-muted-foreground")} />
                                <span className="text-xs font-medium text-center leading-tight">{section.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Active Filter Chips */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Active filters:</span>
                            {selectedNeighborhoods.map((neighborhood) => (
                                <Badge
                                    key={neighborhood}
                                    variant="secondary"
                                    className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setSelectedNeighborhoods(prev => prev.filter(n => n !== neighborhood))}
                                >
                                    {neighborhood}
                                    <span className="ml-1">×</span>
                                </Badge>
                            ))}
                            {selectedLots.map((lot) => (
                                <Badge
                                    key={lot}
                                    variant="secondary"
                                    className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setSelectedLots(prev => prev.filter(l => l !== lot))}
                                >
                                    Lot {lot}
                                    <span className="ml-1">×</span>
                                </Badge>
                            ))}
                            {selectedInterests.map((interest) => (
                                <Badge
                                    key={interest}
                                    variant="secondary"
                                    className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setSelectedInterests(prev => prev.filter(i => i !== interest))}
                                >
                                    {interest}
                                    <span className="ml-1">×</span>
                                </Badge>
                            ))}
                            {selectedSkills.map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skill))}
                                >
                                    {skill}
                                    <span className="ml-1">×</span>
                                </Badge>
                            ))}
                            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2 text-xs">
                                Clear all
                            </Button>
                        </div>
                    )}

                    {/* Collapsible Filter Panel */}
                    <AnimatePresence mode="wait">
                        {activeFilter && (
                            <motion.div
                                key={activeFilter}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-2 border-muted/50">
                                    <CardContent className="p-4">
                                        {activeFilter === "neighborhood" && (
                                            <div className="space-y-4">
                                                <h4 className="font-medium text-sm">Select Neighborhoods</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {neighborhoods.map((neighborhood) => (
                                                        <div key={neighborhood.id} className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`neighborhood-${neighborhood.id}`}
                                                                checked={selectedNeighborhoods.includes(neighborhood.name)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedNeighborhoods([...selectedNeighborhoods, neighborhood.name])
                                                                    } else {
                                                                        setSelectedNeighborhoods(selectedNeighborhoods.filter((n) => n !== neighborhood.name))
                                                                    }
                                                                }}
                                                            />
                                                            <Label
                                                                htmlFor={`neighborhood-${neighborhood.id}`}
                                                                className="cursor-pointer text-sm font-normal"
                                                            >
                                                                {neighborhood.name}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeFilter === "lot" && (
                                            <div className="space-y-2">
                                                <MultiSelect
                                                    options={uniqueLots.map(lot => ({ value: lot, label: `Lot ${lot}` }))}
                                                    selected={selectedLots}
                                                    onChange={setSelectedLots}
                                                    placeholder="Select lots..."
                                                    searchPlaceholder="Search lots..."
                                                    emptyMessage="No lots found."
                                                />
                                            </div>
                                        )}

                                        {activeFilter === "interests" && (
                                            <div className="space-y-2">
                                                <MultiSelect
                                                    options={allInterests.map(i => ({ value: i.name, label: i.name }))}
                                                    selected={selectedInterests}
                                                    onChange={setSelectedInterests}
                                                    placeholder="Select interests..."
                                                    searchPlaceholder="Search interests..."
                                                    emptyMessage="No interests found."
                                                />
                                            </div>
                                        )}

                                        {activeFilter === "skills" && (
                                            <div className="space-y-2">
                                                <MultiSelect
                                                    options={uniqueSkills.map(s => ({ value: s, label: s }))}
                                                    selected={selectedSkills}
                                                    onChange={setSelectedSkills}
                                                    placeholder="Select skills..."
                                                    searchPlaceholder="Search skills..."
                                                    emptyMessage="No skills found."
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Content Grid - Residents */}
            {activeTab === "residents" && (
                <div className="space-y-6">
                    {/* Results Header */}
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border"></div>
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {filteredResidents.length} {filteredResidents.length === 1 ? "Resident" : "Residents"}
                        </h2>
                        <div className="h-px flex-1 bg-border"></div>
                    </div>

                    {paginatedResidents.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {paginatedResidents.map((resident, index) => (
                                        <motion.div
                                            key={resident.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            layout
                                        >
                                            <ResidentCard
                                                resident={resident}
                                                tenantSlug={tenantSlug}
                                                currentUserFamilyId={currentUserFamilyId}
                                                neighborLists={neighborLists}
                                                tenantId={currentTenantId}
                                                isTenantAdmin={isTenantAdmin}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {hasMoreResidents && (
                                <div className="flex justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={() => setResidentPage((prev) => prev + 1)}
                                    >
                                        Load More Residents
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <DirectoryEmptyState
                            type="residents"
                            hasActiveFilters={activeFilterCount > 0 || search !== ""}
                            onClearFilters={clearAllFilters}
                            onClearSearch={() => setSearch("")}
                        />
                    )}
                </div>
            )}

            {/* Content Grid - Families */}
            {activeTab === "families" && (
                <div className="space-y-6">
                    {/* Results Header */}
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border"></div>
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {filteredFamilies.length} {filteredFamilies.length === 1 ? "Household" : "Households"}
                        </h2>
                        <div className="h-px flex-1 bg-border"></div>
                    </div>

                    {paginatedFamilies.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {paginatedFamilies.map((family, index) => (
                                        <motion.div
                                            key={family.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            layout
                                        >
                                            <FamilyCard
                                                family={family}
                                                tenantSlug={tenantSlug}
                                                currentUserFamilyId={currentUserFamilyId}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {hasMoreFamilies && (
                                <div className="flex justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={() => setFamilyPage((prev) => prev + 1)}
                                    >
                                        Load More Families
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <DirectoryEmptyState
                            type="families"
                            hasActiveFilters={selectedNeighborhoods.length > 0 || search !== ""}
                            onClearFilters={clearAllFilters}
                            onClearSearch={() => setSearch("")}
                        />
                    )}
                </div>
            )}

            {/* Content Grid - Lists */}
            {activeTab === "lists" && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="h-px flex-1 bg-border"></div>
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {filteredLists.length} {filteredLists.length === 1 ? "List" : "Lists"}
                            </h2>
                            <div className="h-px flex-1 bg-border"></div>
                        </div>
                    </div>

                    {filteredLists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLists.map((list) => (
                                <div key={list.id} onClick={() => setSelectedList(list)}>
                                    <ListCard
                                        list={list}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <DirectoryEmptyState
                            type="lists"
                            hasActiveFilters={search !== ""}
                            onClearFilters={clearAllFilters}
                            onClearSearch={() => setSearch("")}
                        >
                            {search === "" && (
                                <Button onClick={() => setCreateListOpen(true)} className="mt-4">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create your first list
                                </Button>
                            )}
                        </DirectoryEmptyState>
                    )}
                </div>
            )}
        </div>
    )
}
