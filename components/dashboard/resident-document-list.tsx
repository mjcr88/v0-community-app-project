"use client"

import { Database } from "@/types/supabase"
import { FileText, File, Download, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { format } from "date-fns"

type Document = Database["public"]["Tables"]["documents"]["Row"]

export function ResidentDocumentList({ documents, slug }: { documents: Document[], slug: string }) {
    const [search, setSearch] = useState("")
    const [category, setCategory] = useState<string>("all")

    // Filter documents
    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
            (doc.description && doc.description.toLowerCase().includes(search.toLowerCase()))

        const matchesCategory = category === "all" || doc.category === category

        return matchesSearch && matchesCategory
    })

    const categoryLabels: Record<string, string> = {
        regulation: "Regulations",
        financial: "Financial",
        construction: "Construction",
        hoa: "HOA"
    }

    const categoryEmojis: Record<string, string> = {
        regulation: "📋",
        financial: "💰",
        construction: "🏗️",
        hoa: "🏠"
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="regulation">📋 Regulations</SelectItem>
                        <SelectItem value="financial">💰 Financial</SelectItem>
                        <SelectItem value="construction">🏗️ Construction</SelectItem>
                        <SelectItem value="hoa">🏠 HOA</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocs.map((doc) => (
                    <div key={doc.id} className="group relative flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">

                        {doc.is_featured && (
                            <div className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
                                ⭐ Featured
                            </div>
                        )}

                        <div className="mb-4 flex items-start gap-4">
                            <div className="rounded-lg bg-muted p-2 h-10 w-10 flex items-center justify-center shrink-0">
                                {doc.document_type === 'pdf' ? (
                                    <File className="h-5 w-5 text-red-500" />
                                ) : (
                                    <FileText className="h-5 w-5 text-blue-500" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold leading-none tracking-tight mb-1 line-clamp-1">{doc.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        {categoryEmojis[doc.category || 'hoa']} {categoryLabels[doc.category || 'hoa']}
                                    </span>
                                    <span>•</span>
                                    <span>{format(new Date(doc.updated_at), 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                        </div>

                        {doc.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {doc.description}
                            </p>
                        )}

                        <div className="mt-auto pt-2">
                            {doc.document_type === 'pdf' && doc.file_url ? (
                                <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                        Download PDF
                                    </a>
                                </Button>
                            ) : (
                                <Button variant="default" size="sm" className="w-full gap-2" asChild>
                                    <Link href={`/t/${slug}/dashboard/official/${doc.id}`}>
                                        <FileText className="h-4 w-4" />
                                        Read Document
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-50" />
                    <p>No documents found matching your search.</p>
                </div>
            )}
        </div>
    )
}
