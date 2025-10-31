"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { createBrowserClient } from "@/lib/supabase/client"
import { Trash2, Mail } from "lucide-react"
import { InviteLinkDialog } from "@/components/invite-link-dialog"

type Resident = {
  id: string
  lot_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  family_unit_id: string | null
  invited_at: string | null
  onboarding_completed: boolean
  tenant_id: string | null
}

type Lot = {
  id: string
  lot_number: string
  neighborhoods: {
    id: string
    name: string
  }
}

type FamilyUnit = {
  id: string
  name: string
  primary_contact_id: string | null
}

export function EditResidentForm({
  slug,
  resident,
  lots,
  familyUnits,
}: {
  slug: string
  resident: Resident
  lots: Lot[]
  familyUnits: FamilyUnit[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState("")
  const [formData, setFormData] = useState({
    lot_id: resident.lot_id,
    first_name: resident.first_name,
    last_name: resident.last_name,
    email: resident.email || "",
    phone: resident.phone || "",
    family_unit_id: resident.family_unit_id || "",
  })
  const [isPrimaryContact, setIsPrimaryContact] = useState(false)

  const handleInvite = async () => {
    if (!formData.email) {
      alert("Please add an email address before inviting")
      return
    }

    setInviteLoading(true)
    const supabase = createBrowserClient()

    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).single()

    if (!tenant) {
      console.error("Tenant not found")
      setInviteLoading(false)
      return
    }

    // Generate invite token
    const inviteToken = crypto.randomUUID()

    // Update resident with invite token, timestamp, and ensure tenant_id is set
    const { error: updateError } = await supabase
      .from("residents")
      .update({
        invite_token: inviteToken,
        invited_at: new Date().toISOString(),
        tenant_id: tenant.id, // Ensure tenant_id is set when sending invite
      })
      .eq("id", resident.id)

    if (updateError) {
      console.error("Error updating resident:", updateError)
      setInviteLoading(false)
      return
    }

    const url = `${window.location.origin}/t/${slug}/invite/${inviteToken}`
    setInviteUrl(url)
    setInviteDialogOpen(true)

    setInviteLoading(false)
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createBrowserClient()

    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).single()

    if (!tenant) {
      console.error("Tenant not found")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from("residents")
      .update({
        lot_id: formData.lot_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phone: formData.phone || null,
        family_unit_id: formData.family_unit_id || null,
        tenant_id: tenant.id, // Ensure tenant_id is always set
        updated_at: new Date().toISOString(),
      })
      .eq("id", resident.id)

    if (error) {
      console.error("Error updating resident:", error)
      setLoading(false)
      return
    }

    if (isPrimaryContact && formData.family_unit_id) {
      await supabase.from("family_units").update({ primary_contact_id: resident.id }).eq("id", formData.family_unit_id)
    }

    setLoading(false)
    router.push(`/t/${slug}/admin/residents`)
    router.refresh()
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.from("residents").delete().eq("id", resident.id)

    if (error) {
      console.error("Error deleting resident:", error)
      setDeleteLoading(false)
      return
    }

    window.location.href = `/t/${slug}/admin/residents`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resident Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lot_id">
              Lot <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.lot_id}
              onValueChange={(value) => setFormData({ ...formData, lot_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a lot" />
              </SelectTrigger>
              <SelectContent>
                {lots.map((lot) => (
                  <SelectItem key={lot.id} value={lot.id}>
                    {lot.lot_number} - {lot.neighborhoods.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="family_unit_id">Family Unit (Optional)</Label>
            <Select
              value={formData.family_unit_id}
              onValueChange={(value) => setFormData({ ...formData, family_unit_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="No family unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No family unit</SelectItem>
                {familyUnits.map((family) => (
                  <SelectItem key={family.id} value={family.id}>
                    {family.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.family_unit_id && formData.family_unit_id !== "none" && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="primary_contact"
                checked={isPrimaryContact}
                onChange={(e) => setIsPrimaryContact(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="primary_contact" className="font-normal">
                Set as primary contact for this family unit
              </Label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {formData.email && !resident.onboarding_completed && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Resident Invitation</h4>
                  <p className="text-sm text-muted-foreground">
                    {resident.invited_at ? "Invitation sent" : "Send invitation to resident"}
                  </p>
                </div>
                <Button type="button" onClick={handleInvite} disabled={inviteLoading} variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  {inviteLoading ? "Sending..." : resident.invited_at ? "Resend Invite" : "Send Invite"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={deleteLoading}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteLoading ? "Deleting..." : "Delete Resident"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this resident. This action cannot be undone.
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

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/t/${slug}/admin/residents`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
        <InviteLinkDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          inviteUrl={inviteUrl}
          title="Resident Invitation Link"
          description="Share this link with the resident to complete their onboarding."
        />
      </CardContent>
    </Card>
  )
}
