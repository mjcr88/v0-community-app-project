import { redirect } from 'next/navigation'
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, HelpCircle, AlertTriangle, Shield, MoreHorizontal, ArrowLeft } from 'lucide-react'
import Link from "next/link"
import { getMyRequests, getCommunityRequests } from "@/app/actions/resident-requests"
import { MyRequestsTable } from "@/components/requests/my-requests-table"
import { CreateRequestButton } from "@/components/requests/create-request-button"
import { CommunityRequestsTable } from "@/components/requests/community-requests-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RequestType } from "@/types/requests"

interface RequestsPageProps {
  params: Promise<{ slug: string }>
}

const requestTypes: Array<{
  type: RequestType
  title: string
  description: string
  icon: typeof Wrench
}> = [
  {
    type: "maintenance",
    title: "Maintenance Request",
    description: "Report something that needs fixing or repair",
    icon: Wrench,
  },
  {
    type: "question",
    title: "Question",
    description: "Ask about processes, policies, or community information",
    icon: HelpCircle,
  },
  {
    type: "complaint",
    title: "Complaint",
    description: "Report an issue or concern about the community or neighbors",
    icon: AlertTriangle,
  },
  {
    type: "safety",
    title: "Safety Issue",
    description: "Report urgent safety concerns that need immediate attention",
    icon: Shield,
  },
  {
    type: "other",
    title: "Other Request",
    description: "Submit a request that doesn't fit other categories",
    icon: MoreHorizontal,
  },
]

export default async function RequestsPage({ params }: RequestsPageProps) {
  const { slug } = await params

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("slug", slug)
    .single()

  if (!tenant) {
    redirect("/")
  }

  const [requests, communityRequests] = await Promise.all([
    getMyRequests(tenant.id),
    getCommunityRequests(tenant.id),
  ])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <Link href={`/t/${slug}/dashboard`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Requests & Forms</h1>
            <p className="text-muted-foreground text-lg">
              Submit requests to the community administration and track their status
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Submit a New Request</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requestTypes.map((requestType) => {
                const IconComponent = requestType.icon
                return (
                  <CreateRequestButton
                    key={requestType.type}
                    tenantSlug={slug}
                    tenantId={tenant.id}
                    requestType={requestType.type}
                  >
                    <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{requestType.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {requestType.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </CreateRequestButton>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <Tabs defaultValue="my-requests" className="w-full">
              <TabsList>
                <TabsTrigger value="my-requests">My Requests</TabsTrigger>
                <TabsTrigger value="community">Community Requests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="my-requests" className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">My Requests</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    All requests you've submitted
                  </p>
                  <MyRequestsTable requests={requests} tenantSlug={slug} />
                </div>
              </TabsContent>

              <TabsContent value="community" className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Community Requests</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Maintenance and safety requests from all residents
                  </p>
                  <CommunityRequestsTable requests={communityRequests} tenantSlug={slug} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
