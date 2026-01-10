"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, FileText, File } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { Database } from "@/types/supabase"

type Document = Database["public"]["Tables"]["documents"]["Row"]

export function AdminDocumentsTable({
    documents,
    slug
}: {
    documents: Document[]
    slug: string
}) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{doc.title}</span>
                                    {doc.is_featured && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            ⭐ Featured
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {doc.document_type === 'pdf' ? (
                                        <File className="h-4 w-4 text-red-500" />
                                    ) : (
                                        <FileText className="h-4 w-4 text-blue-500" />
                                    )}
                                    <span className="capitalize">{doc.document_type}</span>
                                </div>
                            </TableCell>
                            <TableCell className="capitalize">{doc.category}</TableCell>
                            <TableCell>
                                <Badge variant={
                                    doc.status === 'published' ? 'default' :
                                        doc.status === 'draft' ? 'secondary' : 'outline'
                                }>
                                    {doc.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(doc.updated_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/t/${slug}/admin/documents/${doc.id}/edit`}>
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
