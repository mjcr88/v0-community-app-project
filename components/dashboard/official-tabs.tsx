import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnnouncementsPageClient } from "./announcements-page-client"
import { DocumentListClient } from "@/components/dashboard/document-list-client"
import { Megaphone, FileText } from "lucide-react"

interface OfficialTabsProps {
    announcements: any[]
    documents: any[]
    slug: string
    userId: string
    tenantId: string
    announcementsEnabled: boolean
}

export function OfficialTabs({ announcements, documents, slug, userId, tenantId, announcementsEnabled }: OfficialTabsProps) {
    return (
        <div className="space-y-8">
            {/* Top Level Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Official</h1>
                    <p className="text-muted-foreground">Community announcements and official documents.</p>
                </div>
            </div>

            <Tabs defaultValue={announcementsEnabled ? "announcements" : "documents"} className="space-y-8">
                {/* Main section tabs - Styled as pills/buttons below header */}
                <TabsList className="bg-muted/30 p-1 rounded-lg h-auto inline-flex w-full md:w-auto">
                    {announcementsEnabled && (
                        <TabsTrigger
                            value="announcements"
                            className="gap-2 px-6 py-2.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all flex-1 md:flex-none"
                        >
                            <Megaphone className="h-4 w-4" />
                            Announcements
                        </TabsTrigger>
                    )}
                    <TabsTrigger
                        value="documents"
                        className="gap-2 px-6 py-2.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all flex-1 md:flex-none"
                    >
                        <FileText className="h-4 w-4" />
                        Documents
                    </TabsTrigger>
                </TabsList>

                {announcementsEnabled && (
                    <TabsContent value="announcements" className="mt-0">
                        <AnnouncementsPageClient
                            announcements={announcements}
                            slug={slug}
                            userId={userId}
                            tenantId={tenantId}
                        />
                    </TabsContent>
                )}

                <TabsContent value="documents" className="mt-0">
                    <DocumentListClient
                        documents={documents}
                        slug={slug}
                        userId={userId}
                        tenantId={tenantId}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
