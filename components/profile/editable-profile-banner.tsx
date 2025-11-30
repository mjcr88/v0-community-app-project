"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Upload, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface EditableProfileBannerProps {
    bannerUrl: string | null
    profileUrl: string | null
    initials: string
    onBannerChange: (url: string | null) => Promise<void>
    onProfilePhotoChange: (url: string | null) => Promise<void>
    isUploading?: boolean
}

export function EditableProfileBanner({
    bannerUrl,
    profileUrl,
    initials,
    onBannerChange,
    onProfilePhotoChange,
    isUploading = false,
}: EditableProfileBannerProps) {
    const { toast } = useToast()
    const [localIsUploading, setLocalIsUploading] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "banner" | "profile") => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Image must be less than 5MB",
                variant: "destructive",
            })
            return
        }

        setLocalIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Upload failed")

            const { url } = await response.json()

            if (type === "banner") {
                await onBannerChange(url)
            } else {
                await onProfilePhotoChange(url)
            }

            toast({
                description: `${type === "banner" ? "Banner" : "Profile photo"} updated successfully`,
            })
        } catch (error) {
            console.error("Upload error:", error)
            toast({
                title: "Upload failed",
                description: "Failed to upload image. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLocalIsUploading(false)
            // Reset input
            e.target.value = ""
        }
    }

    const handleDeleteBanner = async () => {
        try {
            await onBannerChange(null)
            toast({ description: "Banner removed" })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove banner",
                variant: "destructive",
            })
        }
    }

    const isLoading = isUploading || localIsUploading

    return (
        <div className="relative mb-16 group">
            {/* Banner Area */}
            <div className="relative h-48 sm:h-64 w-full overflow-hidden rounded-xl bg-muted border border-border/50">
                {bannerUrl ? (
                    <img src={bannerUrl} alt="Profile Banner" className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <p className="text-muted-foreground text-sm font-medium">Add a banner image</p>
                    </div>
                )}

                {/* Banner Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        disabled={isLoading}
                        onClick={() => document.getElementById("banner-upload")?.click()}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {bannerUrl ? "Change Banner" : "Upload Banner"}
                    </Button>

                    {bannerUrl && (
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isLoading}
                            onClick={handleDeleteBanner}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}

                    <input
                        id="banner-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "banner")}
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Profile Avatar Area */}
            <div className="absolute -bottom-12 left-6 sm:left-8">
                <div className="relative group/avatar">
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
                        <AvatarImage src={profileUrl || undefined} className="object-cover" />
                        <AvatarFallback className="text-2xl sm:text-4xl bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Avatar Edit Overlay */}
                    <button
                        className={cn(
                            "absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity",
                            isLoading && "opacity-100 cursor-not-allowed"
                        )}
                        onClick={() => !isLoading && document.getElementById("profile-upload")?.click()}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                            <Camera className="h-6 w-6 text-white" />
                        )}
                    </button>

                    <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "profile")}
                        disabled={isLoading}
                    />
                </div>
            </div>
        </div>
    )
}
