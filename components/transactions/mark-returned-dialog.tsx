"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload, Loader2, X, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface MarkReturnedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: {
    return_condition: "good" | "minor_wear" | "damaged" | "broken"
    return_notes?: string
    return_damage_photo_url?: string
  }) => Promise<void>
  itemName: string
  transactionId: string
}

export function MarkReturnedDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  transactionId,
}: MarkReturnedDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [condition, setCondition] = useState<"good" | "minor_wear" | "damaged" | "broken">("good")
  const [notes, setNotes] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setPhotoUrl(data.url)

      toast({
        description: "Photo uploaded successfully",
      })
    } catch (error) {
      console.error("[v0] Photo upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const removePhoto = () => {
    setPhotoUrl(null)
  }

  const handleConfirm = async () => {
    if (!condition) {
      toast({
        title: "Condition required",
        description: "Please select a return condition",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await onConfirm({
        return_condition: condition,
        return_notes: notes || undefined,
        return_damage_photo_url: photoUrl || undefined,
      })
      
      // Reset form
      setCondition("good")
      setNotes("")
      setPhotoUrl(null)
      
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error confirming return:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const showPhotoUpload = condition === "damaged" || condition === "broken"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            Mark Item as Returned
          </DialogTitle>
          <DialogDescription>
            Document the return condition of "{itemName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          {/* Return Condition */}
          <div className="space-y-3">
            <Label>Return Condition *</Label>
            <RadioGroup value={condition} onValueChange={(value) => setCondition(value as any)}>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="good" id="good" />
                <Label htmlFor="good" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">Good</div>
                    <div className="text-xs text-muted-foreground">No issues, like new</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="minor_wear" id="minor_wear" />
                <Label htmlFor="minor_wear" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Minor Wear</div>
                    <div className="text-xs text-muted-foreground">Light use marks, fully functional</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="damaged" id="damaged" />
                <Label htmlFor="damaged" className="flex items-center gap-2 cursor-pointer flex-1">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="font-medium">Damaged</div>
                    <div className="text-xs text-muted-foreground">Noticeable damage, may affect use</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="broken" id="broken" />
                <Label htmlFor="broken" className="flex items-center gap-2 cursor-pointer flex-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="font-medium">Broken</div>
                    <div className="text-xs text-muted-foreground">Not functional, requires repair</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="return-notes">
              Notes {showPhotoUpload && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="return-notes"
              placeholder="Describe the condition or any issues..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            {showPhotoUpload && (
              <p className="text-xs text-muted-foreground">
                Please describe the damage in detail
              </p>
            )}
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>
              Photo of Damage
              {showPhotoUpload && <span className="text-destructive ml-1">*</span>}
            </Label>
            
            {!photoUrl ? (
              <>
                <Input
                  id="damage-photo"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant={showPhotoUpload ? "default" : "outline"}
                  onClick={() => document.getElementById("damage-photo")?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {showPhotoUpload ? "Upload Photo (Required)" : "Upload Photo (Optional)"}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="relative rounded-lg border overflow-hidden">
                <div className="relative w-full max-h-64 aspect-video">
                  <Image
                    src={photoUrl || "/placeholder.svg"}
                    alt="Damage photo"
                    fill
                    className="object-contain"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              {showPhotoUpload 
                ? "Photo required for damaged/broken items" 
                : "Optional: Upload a photo for documentation"}
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || uploading}>
            {isLoading ? "Saving..." : "Mark as Returned"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
