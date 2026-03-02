"use client"

import { useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Check, X, UserPlus, Inbox, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

export interface AccessRequest {
    id: string
    email: string
    first_name: string
    last_name: string
    family_name: string | null
    lot_id: string | null
    in_costa_rica: boolean
    status: string
    created_at: string
    lots?: {
        id: string
        lot_number: string
    } | null
}

interface AccessRequestsTableProps {
    requests: AccessRequest[]
    slug: string
    lots: { id: string; lot_number: string }[]
    occupiedLotIds: string[]
}

export function AccessRequestsTable({
    requests: initialRequests,
    slug,
    lots,
    occupiedLotIds,
}: AccessRequestsTableProps) {
    const [requests, setRequests] = useState(initialRequests)
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [processing, setProcessing] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const router = useRouter()

    const occupiedSet = new Set(occupiedLotIds)

    const pendingRequests = requests.filter((r) => r.status === "pending")
    const crRequests = pendingRequests.filter((r) => r.in_costa_rica)
    const nonCrRequests = pendingRequests.filter((r) => !r.in_costa_rica)

    const handleApprove = (request: AccessRequest) => {
        const params = new URLSearchParams()
        params.set("from_request", request.id)

        router.push(`/t/${slug}/admin/residents/create?${params.toString()}`)
    }

    const handleReject = async (requestId: string) => {
        setProcessing(requestId)
        setActionError(null)
        try {
            const supabase = createBrowserClient()
            const { error } = await supabase
                .from("access_requests")
                .update({
                    status: "rejected",
                    reviewed_at: new Date().toISOString(),
                })
                .eq("id", requestId)

            if (error) {
                setActionError("Failed to reject request. Please try again.")
                return
            }

            setRequests((prev) =>
                prev.map((r) =>
                    r.id === requestId ? { ...r, status: "rejected" } : r
                )
            )
        } catch (err) {
            console.error("[access-requests] Reject failed:", err)
            setActionError("Failed to reject request. Please try again.")
        } finally {
            setProcessing(null)
            setRejectingId(null)
        }
    }

    const getLotDisplay = (request: AccessRequest) => {
        if (!request.lot_id) return <span className="text-mist-gray">—</span>

        const lot = lots.find((l) => l.id === request.lot_id)
        if (!lot) return <span className="text-mist-gray">—</span>

        const isOccupied = occupiedSet.has(lot.id)
        return (
            <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-mist-gray" />
                <span>Lot {lot.lot_number}</span>
                <Badge
                    variant="outline"
                    className={isOccupied
                        ? "bg-sunrise/10 text-sunrise border-sunrise/30 text-xs"
                        : "bg-forest-canopy/10 text-forest-canopy border-forest-canopy/30 text-xs"
                    }
                >
                    {isOccupied ? "Occupied" : "Available"}
                </Badge>
            </span>
        )
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    const renderTable = (filteredRequests: AccessRequest[]) => {
        if (filteredRequests.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <Inbox className="h-12 w-12 text-mist-gray mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                    <p className="text-sm text-mist-gray">New access requests will appear here.</p>
                </div>
            )
        }

        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Family</TableHead>
                            <TableHead>Lot</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRequests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell className="font-medium">
                                    {request.first_name} {request.last_name}
                                </TableCell>
                                <TableCell className="text-mist-gray">
                                    {request.email}
                                </TableCell>
                                <TableCell>
                                    {request.family_name || <span className="text-mist-gray">—</span>}
                                </TableCell>
                                <TableCell>{getLotDisplay(request)}</TableCell>
                                <TableCell className="text-mist-gray text-sm">
                                    {formatDate(request.created_at)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-forest-canopy text-forest-canopy hover:bg-forest-canopy hover:text-white"
                                            onClick={() => handleApprove(request)}
                                            disabled={processing === request.id}
                                        >
                                            <UserPlus className="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-clay-red text-clay-red hover:bg-clay-red hover:text-white"
                                            onClick={() => setRejectingId(request.id)}
                                            disabled={processing === request.id}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <>
            {actionError && (
                <div className="mb-3 rounded-md border border-clay-red/30 bg-clay-mist px-3 py-2 text-sm text-clay-red">
                    {actionError}
                </div>
            )}
            <Tabs defaultValue="in_cr" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
                    <TabsTrigger value="in_cr" className="flex items-center gap-1.5">
                        🇨🇷 In Costa Rica
                        {crRequests.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">{crRequests.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="not_cr" className="flex items-center gap-1.5">
                        🌎 Not yet in CR
                        {nonCrRequests.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">{nonCrRequests.length}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="in_cr">
                    {renderTable(crRequests)}
                </TabsContent>

                <TabsContent value="not_cr">
                    {renderTable(nonCrRequests)}
                </TabsContent>
            </Tabs>

            {/* Reject confirmation dialog */}
            <AlertDialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject Access Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to reject this access request? The requester will not be notified automatically.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-clay-red hover:bg-clay-red/90 text-white"
                            onClick={() => rejectingId && handleReject(rejectingId)}
                        >
                            Reject Request
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
