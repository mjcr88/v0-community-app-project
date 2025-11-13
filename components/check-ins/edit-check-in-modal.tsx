"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CHECK_IN_ACTIVITIES } from "@/lib/check-in-activities"
import { updateCheckIn, getCheckInById } from "@/app/actions/check-ins"
import { toast } from "sonner"

interface EditCheckInModalProps {
  checkInId: string
  tenantId: string
  tenantSlug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCheckInModal({ checkInId, tenantId, tenantSlug, open, onOpenChange }: EditCheckInModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [activityType, setActivityType] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (open && checkInId) {
      loadCheckIn()
    }
  }, [open, checkInId])

  async function loadCheckIn() {
    const result = await getCheckInById(checkInId, tenantId)

    if (result.success && result.data) {
      setTitle(result.data.title)
      setActivityType(result.data.activity_type)
      setDescription(result.data.description || "")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    setIsLoading(true)

    const result = await updateCheckIn(checkInId, tenantSlug, tenantId, {
      title: title.trim(),
      activity_type: activityType,
      description: description.trim() || null,
    })

    if (result.success) {
      toast.success("Check-in updated")
      onOpenChange(false)
    } else {
      toast.error(result.error || "Failed to update check-in")
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Check-in</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you up to?"
              required
            />
          </div>

          {/* Activity Type */}
          <div className="space-y-2">
            <Label htmlFor="edit-activity">Activity *</Label>
            <Select value={activityType} onValueChange={setActivityType} required>
              <SelectTrigger id="edit-activity">
                <SelectValue placeholder="Select activity" />
              </SelectTrigger>
              <SelectContent>
                {CHECK_IN_ACTIVITIES.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <SelectItem key={activity.value} value={activity.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {activity.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
