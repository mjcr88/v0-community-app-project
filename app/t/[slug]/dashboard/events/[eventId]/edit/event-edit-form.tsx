"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { updateEvent, deleteEvent } from "@/app/actions/events"
import { Loader2, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

type Category = {
  id: string
  name: string
  icon: string | null
}

type Event = {
  id: string
  title: string
  description: string | null
  category_id: string
  event_type: "resident" | "official"
  start_date: string
  start_time: string | null
  end_date: string | null
  end_time: string | null
  status: "draft" | "published" | "cancelled"
  visibility_scope: "community" | "neighborhood" | "private"
}

type EventEditFormProps = {
  tenantSlug: string
  tenantId: string
  event: Event
  categories: Category[]
}

export function EventEditForm({ tenantSlug, tenantId, event, categories }: EventEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || "",
    categoryId: event.category_id,
    eventType: event.event_type,
    startDate: event.start_date,
    startTime: event.start_time || "",
    endDate: event.end_date || "",
    endTime: event.end_time || "",
    status: event.status,
    visibilityScope: event.visibility_scope,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateEvent(tenantSlug, event.id, {
        title: formData.title,
        description: formData.description || null,
        category_id: formData.categoryId,
        event_type: formData.eventType,
        start_date: formData.startDate,
        start_time: formData.startTime || null,
        end_date: formData.endDate || formData.startDate,
        end_time: formData.endTime || null,
        status: formData.status,
        visibility_scope: formData.visibilityScope,
      })

      toast({
        title: "Event updated successfully!",
        description: `"${formData.title}" has been updated.`,
        variant: "default",
      })

      setTimeout(() => {
        router.push(`/t/${tenantSlug}/dashboard/events/${event.id}`)
      }, 500)
    } catch (error) {
      console.error("Error updating event:", error)
      toast({
        title: "Failed to update event",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteEvent(tenantSlug, event.id)

      toast({
        title: "Event deleted successfully",
        description: `"${formData.title}" has been deleted.`,
        variant: "default",
      })

      setTimeout(() => {
        router.push(`/t/${tenantSlug}/dashboard/events`)
      }, 500)
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Failed to delete event",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  const handleStartDateChange = (value: string) => {
    setFormData({
      ...formData,
      startDate: value,
      endDate: formData.endDate || value,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Update information about your event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Community BBQ, Yoga Class, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell people what your event is about..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon ? `${category.icon} ` : ""}
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">Leave empty for single-day event</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Event Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "draft" | "published" | "cancelled") =>
                setFormData({ ...formData, status: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center gap-2 pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={isDeleting || isSubmitting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Event
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your event and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Event"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" asChild disabled={isSubmitting || isDeleting}>
                <Link href={`/t/${tenantSlug}/dashboard/events/${event.id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
