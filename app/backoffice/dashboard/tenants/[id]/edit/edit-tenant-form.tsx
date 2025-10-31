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
import { InviteLinkDialog } from "@/components/invite-link-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface TenantAdmin {
  id: string
  name: string | null
  email: string
}

interface Tenant {
  id: string
  name: string
  slug: string
  max_neighborhoods: number
  tenant_admin_id: string | null
  tenant_admin: TenantAdmin | null
}

export default function EditTenantForm({ tenant }: { tenant: Tenant }) {
  const [name, setName] = useState(tenant.name)
  const [maxNeighborhoods, setMaxNeighborhoods] = useState(tenant.max_neighborhoods.toString())
  const [adminName, setAdminName] = useState(tenant.tenant_admin?.name || "")
  const [adminEmail, setAdminEmail] = useState(tenant.tenant_admin?.email || "")
  const [adminId, setAdminId] = useState<string | null>(tenant.tenant_admin_id)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const handleSubmit = async (e: React.FormEvent, shouldInvite = false) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      console.log("[v0] Updating tenant:", tenant.id)
      const slug = generateSlug(name)

      if (!slug) {
        throw new Error("Invalid tenant name. Please use alphanumeric characters.")
      }

      if (adminName && !adminEmail) {
        throw new Error("Email is required for tenant administrator")
      }

      let newAdminId = adminId

      if (adminEmail && adminName) {
        console.log("[v0] Checking for existing user with email:", adminEmail)
        const { data: existingUser } = await supabase.from("users").select("id").eq("email", adminEmail).single()

        // Generate invite token if inviting
        const inviteToken = shouldInvite ? crypto.randomUUID() : null
        const invitedAt = shouldInvite ? new Date().toISOString() : null

        if (existingUser) {
          console.log("[v0] Updating existing user:", existingUser.id)
          const { error: updateError } = await supabase
            .from("users")
            .update({
              name: adminName,
              role: "tenant_admin",
              tenant_id: tenant.id,
              ...(shouldInvite && { invite_token: inviteToken, invited_at: invitedAt }),
            })
            .eq("id", existingUser.id)

          if (updateError) {
            console.error("[v0] Error updating user:", updateError)
            throw updateError
          }
          newAdminId = existingUser.id
        } else {
          console.log("[v0] Creating new user")
          const newUserId = crypto.randomUUID()
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
              id: newUserId,
              email: adminEmail,
              name: adminName,
              role: "tenant_admin",
              tenant_id: tenant.id,
              invite_token: inviteToken,
              invited_at: invitedAt,
            })
            .select()
            .single()

          if (createError) {
            console.error("[v0] Error creating user:", createError)
            throw createError
          }
          newAdminId = newUser.id
          console.log("[v0] New user created:", newUser.id)
        }

        if (shouldInvite && inviteToken) {
          const inviteUrl = `${window.location.origin}/backoffice/invite/${inviteToken}`
          setInviteUrl(inviteUrl)
          setInviteDialogOpen(true)
        }
      }

      console.log("[v0] Updating tenant with admin_id:", newAdminId)
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({
          name,
          slug,
          max_neighborhoods: Number.parseInt(maxNeighborhoods),
          tenant_admin_id: newAdminId,
        })
        .eq("id", tenant.id)

      if (tenantError) {
        console.error("[v0] Error updating tenant:", tenantError)
        throw tenantError
      }

      setAdminId(newAdminId)
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Error in handleSubmit:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      // Check if tenant has any related data
      const { data: neighborhoods } = await supabase
        .from("neighborhoods")
        .select("id")
        .eq("tenant_id", tenant.id)
        .limit(1)

      if (neighborhoods && neighborhoods.length > 0) {
        alert(
          "Cannot delete tenant with existing neighborhoods. Please delete all neighborhoods, lots, and residents first.",
        )
        setDeleteLoading(false)
        return
      }

      const { data: residents } = await supabase.from("residents").select("id").eq("tenant_id", tenant.id).limit(1)

      if (residents && residents.length > 0) {
        alert("Cannot delete tenant with existing residents. Please delete all residents first.")
        setDeleteLoading(false)
        return
      }

      // Delete the tenant
      const { error } = await supabase.from("tenants").delete().eq("id", tenant.id)

      if (error) throw error

      router.push("/backoffice/dashboard")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting tenant:", error)
      alert("Failed to delete tenant. Please try again.")
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <Link href={`/backoffice/dashboard/tenants/${tenant.id}`}>
            <Button variant="ghost" size="sm">
              ← Back to Tenant
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Tenant</CardTitle>
            <CardDescription>Update tenant details and configuration</CardDescription>
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
                    disabled={isSaving}
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
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of neighborhoods this tenant can create
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium mb-4">Tenant Administrator</h3>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="adminName">Admin Name</Label>
                      <Input
                        id="adminName"
                        type="text"
                        placeholder="John Doe"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="adminEmail">
                        Admin Email {adminName && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="admin@ecovilla.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        disabled={isSaving}
                        required={!!adminName}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    If the email doesn't exist, a new tenant admin user will be created
                  </p>
                </div>

                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                <div className="flex gap-3 justify-end">
                  <Link href={`/backoffice/dashboard/tenants/${tenant.id}`}>
                    <Button type="button" variant="outline" disabled={isSaving}>
                      Cancel
                    </Button>
                  </Link>
                  {adminEmail ? (
                    <>
                      <Button type="submit" variant="outline" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button type="button" onClick={(e) => handleSubmit(e, true)} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save & Invite Admin"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>

            <div className="border-t mt-8 pt-6">
              <h3 className="text-sm font-medium mb-2 text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete this tenant. This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={deleteLoading}>
                    <Loader2 className={`mr-2 h-4 w-4 ${deleteLoading ? "animate-spin" : "hidden"}`} />
                    {deleteLoading ? "Deleting..." : "Delete Tenant"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this tenant and all associated data. This action cannot be undone.
                      You can only delete a tenant if all neighborhoods, lots, and residents have been removed first.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Invite link dialog */}
        {inviteDialogOpen && (
          <InviteLinkDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            inviteUrl={inviteUrl || ""}
            title="Tenant Admin Invitation Link"
            description="Share this link with the tenant admin to complete their account setup."
          />
        )}
      </div>
    </div>
  )
}
