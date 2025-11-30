"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Filter, X, ChevronDown, Wrench, HelpCircle, AlertTriangle, Shield, MoreHorizontal } from 'lucide-react'
import { RequestCard } from "@/components/requests/request-card"
import { RioEmptyState } from "@/components/exchange/rio-empty-state"
import { useRouter } from "next/navigation"
import type { ResidentRequestWithRelations, RequestType, RequestStatus, RequestPriority } from "@/types/requests"

interface RequestsPageClientProps {
    requests: ResidentRequestWithRelations[]
    tenantSlug: string
}

const requestTypes: { value: RequestType; label: string; icon: any }[] = [
    { value: 'maintenance', label: 'Maintenance', icon: Wrench },
    { value: 'question', label: 'Question', icon: HelpCircle },
    { value: 'complaint', label: 'Complaint', icon: AlertTriangle },
    { value: 'safety', label: 'Safety', icon: Shield },
    { value: 'other', label: 'Other', icon: MoreHorizontal },
]

const statusOptions: { value: RequestStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
]

const priorityOptions: { value: RequestPriority; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'emergency', label: 'Emergency' },
]

export function RequestsPageClient({ requests, tenantSlug }: RequestsPageClientProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedTypes, setSelectedTypes] = useState<RequestType[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<RequestStatus[]>(['pending', 'in_progress'])
    const [selectedPriorities, setSelectedPriorities] = useState<RequestPriority[]>([])

    const filteredRequests = useMemo(() => {
        return requests.filter((request) => {
            // Search filter
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase()
                const titleMatch = request.title.toLowerCase().includes(searchLower)
                const descMatch = request.description.toLowerCase().includes(searchLower)
                if (!titleMatch && !descMatch) return false
            }

            // Type filter
            if (selectedTypes.length > 0) {
                if (!selectedTypes.includes(request.request_type)) return false
            }

            // Status filter
            if (selectedStatuses.length > 0) {
                if (!selectedStatuses.includes(request.status)) return false
            }

            // Priority filter
            if (selectedPriorities.length > 0) {
                if (!selectedPriorities.includes(request.priority)) return false
            }

            return true
        })
    }, [requests, searchQuery, selectedTypes, selectedStatuses, selectedPriorities])

    const handleTypeToggle = (type: RequestType) => {
        setSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        )
    }

    const handleStatusToggle = (status: RequestStatus) => {
        setSelectedStatuses((prev) =>
            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
        )
    }

    const handlePriorityToggle = (priority: RequestPriority) => {
        setSelectedPriorities((prev) =>
            prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
        )
    }

    const clearFilters = () => {
        setSearchQuery("")
        setSelectedTypes([])
        setSelectedStatuses([])
        setSelectedPriorities([])
    }

    const hasActiveFilters =
        searchQuery ||
        selectedTypes.length > 0 ||
        selectedStatuses.length > 0 ||
        selectedPriorities.length > 0

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-11 bg-card border-border shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Type Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-between bg-card border-border shadow-sm hover:bg-accent hover:text-accent-foreground">
                                <span className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Type
                                    {selectedTypes.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 badge-enter">
                                            {selectedTypes.length}
                                        </Badge>
                                    )}
                                </span>
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 shadow-lg border-border" align="start">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Request Type</h4>
                                {requestTypes.map((type) => (
                                    <div key={type.value} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`type-${type.value}`}
                                            checked={selectedTypes.includes(type.value)}
                                            onCheckedChange={() => handleTypeToggle(type.value)}
                                        />
                                        <Label htmlFor={`type-${type.value}`} className="cursor-pointer text-sm font-normal flex-1 flex items-center gap-2">
                                            <type.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                            {type.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Status Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-between bg-card border-border shadow-sm hover:bg-accent hover:text-accent-foreground">
                                <span className="flex items-center gap-2">
                                    Status
                                    {selectedStatuses.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 badge-enter">
                                            {selectedStatuses.length}
                                        </Badge>
                                    )}
                                </span>
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 shadow-lg border-border" align="start">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Status</h4>
                                {statusOptions.map((status) => (
                                    <div key={status.value} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`status-${status.value}`}
                                            checked={selectedStatuses.includes(status.value)}
                                            onCheckedChange={() => handleStatusToggle(status.value)}
                                        />
                                        <Label htmlFor={`status-${status.value}`} className="cursor-pointer text-sm font-normal flex-1">
                                            {status.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Priority Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-between bg-card border-border shadow-sm hover:bg-accent hover:text-accent-foreground">
                                <span className="flex items-center gap-2">
                                    Priority
                                    {selectedPriorities.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 badge-enter">
                                            {selectedPriorities.length}
                                        </Badge>
                                    )}
                                </span>
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 shadow-lg border-border" align="start">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Priority</h4>
                                {priorityOptions.map((priority) => (
                                    <div key={priority.value} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`priority-${priority.value}`}
                                            checked={selectedPriorities.includes(priority.value)}
                                            onCheckedChange={() => handlePriorityToggle(priority.value)}
                                        />
                                        <Label htmlFor={`priority-${priority.value}`} className="cursor-pointer text-sm font-normal flex-1">
                                            {priority.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {searchQuery && (
                            <Badge variant="secondary" className="gap-1">
                                Search: {searchQuery}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                            </Badge>
                        )}
                        {selectedTypes.map((type) => (
                            <Badge key={type} variant="secondary" className="gap-1">
                                {requestTypes.find(t => t.value === type)?.label}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => handleTypeToggle(type)} />
                            </Badge>
                        ))}
                        {selectedStatuses.map((status) => (
                            <Badge key={status} variant="secondary" className="gap-1">
                                {statusOptions.find(s => s.value === status)?.label}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => handleStatusToggle(status)} />
                            </Badge>
                        ))}
                        {selectedPriorities.map((priority) => (
                            <Badge key={priority} variant="secondary" className="gap-1">
                                {priorityOptions.find(p => p.value === priority)?.label}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => handlePriorityToggle(priority)} />
                            </Badge>
                        ))}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-7 text-primary hover:text-primary hover:bg-primary/10"
                        >
                            Clear all
                        </Button>
                    </div>
                )}

                <div className="text-sm text-muted-foreground">
                    Showing {filteredRequests.length} of {requests.length} requests
                </div>
            </div>

            {/* Results Grid */}
            {filteredRequests.length === 0 ? (
                <RioEmptyState
                    variant={hasActiveFilters ? "no-matches" : "no-listings"}
                    title={hasActiveFilters ? "No requests match your filters" : "No requests yet"}
                    description={
                        hasActiveFilters
                            ? "Try adjusting your search or filters to see more results."
                            : "Be the first to submit a request to the community!"
                    }
                    action={
                        hasActiveFilters ? (
                            <Button variant="outline" onClick={clearFilters}>
                                Clear all filters
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRequests.map((request) => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            onClick={() => router.push(`/t/${tenantSlug}/dashboard/requests/${request.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
