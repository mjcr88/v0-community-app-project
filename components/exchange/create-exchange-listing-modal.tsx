"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createExchangeListing, getExchangeCategories } from "@/app/actions/exchange-listings"
import { Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface CreateExchangeListingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantSlug: string
  tenantId: string
}

export function CreateExchangeListingModal({
  open,
  onOpenChange,
  tenantSlug,
  tenantId,
}: CreateExchangeListingModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    status: "draft" as "draft" | "published",
  })

  // Load categories when modal opens
  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open, tenantId])

  const loadCategories = async () => {
    setIsLoadingCategories(true)
    const categoriesData = await getExchangeCategories(tenantId)
    setCategories(categoriesData)
    setIsLoadingCategories(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast({
          title: "Title required",
          description: "Please enter a title for your listing",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.category_id) {
        toast({
          title: "Category required",
          description: "Please select a category for your listing",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const listingData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        status: formData.status,
      }

      const result = await createExchangeListing(tenantSlug, tenantId, listingData)

      if (result.success) {
        toast({
          title: formData.status === "published" ? "Listing published!" : "Draft saved!",
          description:
            formData.status === "published"
              ? "Your listing is now visible to the community."
              : "You can continue editing and publish when ready.",
        })
        onOpenChange(false)
        // Reset form
        setFormData({
          title: "",
          description: "",
          category_id: "",
          status: "draft",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create listing",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Listing creation error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Exchange Listing</DialogTitle>
          <DialogDescription>Share something with your community - tools, food, services, and more</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Listing Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Tall Ladder, Fresh Mangos, Graphic Design Services..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Keep it clear and descriptive</p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                {isLoadingCategories ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading categories...
                  </div>
                ) : (
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Choose the category that best fits what you're offering
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell your community more about this item or service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Add details like condition, availability, or special instructions
                </p>
              </div>

              {/* Status Selection */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Listing Status</Label>
                  <p className="text-sm text-muted-foreground">Choose whether to publish now or save as draft</p>
                </div>

                <RadioGroup
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as "draft" | "published" })}
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="draft" id="draft" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="draft" className="font-medium cursor-pointer">
                          Save as Draft
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Save your listing privately and continue editing later
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="published" id="published" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="published" className="font-medium cursor-pointer">
                          Publish Now
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Make your listing visible to the community immediately
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting
                    ? "Creating..."
                    : formData.status === "published"
                      ? "Publish Listing"
                      : "Save Draft"}
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </DialogContent>
    </Dialog>
  )
}
