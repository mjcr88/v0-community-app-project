"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function CreateTenantPage() {
  const [name, setName] = useState("")
  const [maxNeighborhoods, setMaxNeighborhoods] = useState("1")
  const [address, setAddress] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const handleSubmit = async (e: React.FormEvent, shouldInvite = false) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Creating tenant with name:", name)
      const slug = generateSlug(name)

      if (!slug) {
        throw new Error("Invalid tenant name. Please use alphanumeric characters.")
      }

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name,
          slug,
          max_neighborhoods: Number.parseInt(maxNeighborhoods),
          address: address || null,
        })
        .select()
        .single()

      if (tenantError) {
        console.error("[v0] Tenant creation error:", tenantError)
        throw tenantError
      }

      console.log("[v0] Tenant created:", tenant)

      if (adminEmail && adminName) {
        console.log("[v0] Creating admin user for tenant")

        const inviteToken = shouldInvite ? crypto.randomUUID() : null
        const invitedAt = shouldInvite ? new Date().toISOString() : null

        const { data: newUser, error: userError } = await supabase
          .from("users")
          .insert({
            email: adminEmail,
            name: adminName,
            role: "tenant_admin",
            tenant_id: tenant.id,
            invite_token: inviteToken,
            invited_at: invitedAt,
          })
          .select()
          .single()

        if (userError) {
          console.error("[v0] User creation error:", userError)
          throw userError
        }

        console.log("[v0] Admin user created:", newUser)

        const { error: updateError } = await supabase
          .from("tenants")
          .update({ tenant_admin_id: newUser.id })
          .eq("id", tenant.id)

        if (updateError) {
          console.error("[v0] Tenant update error:", updateError)
          throw updateError
        }

        if (shouldInvite && inviteToken) {
          const inviteUrl = `${window.location.origin}/t/${slug}/invite/${inviteToken}`
          alert(`Tenant admin created and invited!\n\nInvite link:\n${inviteUrl}`)
        }
      }

      router.push("/backoffice/dashboard")
    } catch (error: unknown) {
      console.error("[v0] Error in handleSubmit:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <Link href="/backoffice/dashboard">
            <Button variant="ghost" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Tenant</CardTitle>
            <CardDescription>Add a new community tenant to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, false)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Tenant Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ecovilla San Mateo"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                  {name && <p className="text-xs text-muted-foreground">Slug: {generateSlug(name)}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="maxNeighborhoods">Max Neighborhoods *</Label>
                  <Input
                    id="maxNeighborhoods"
                    type="number"
                    min="1"
                    required
                    value={maxNeighborhoods}
                    onChange={(e) => setMaxNeighborhoods(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of neighborhoods this tenant can create
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Main St, City, State, ZIP"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">Optional default address for this community</p>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium mb-4">Tenant Admin (Optional)</h3>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="adminName">Admin Name</Label>
                      <Input
                        id="adminName"
                        type="text"
                        placeholder="John Doe"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="adminEmail">Admin Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="admin@ecovilla.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">You can assign or change the tenant admin later</p>
                </div>

                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                <div className="flex gap-3 justify-end">
                  <Link href="/backoffice/dashboard">
                    <Button type="button" variant="outline" disabled={isLoading}>
                      Cancel
                    </Button>
                  </Link>
                  {adminEmail ? (
                    <>
                      <Button type="submit" variant="outline" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Admin"
                        )}
                      </Button>
                      <Button type="button" onClick={(e) => handleSubmit(e, true)} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create & Invite Admin"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Tenant"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
