"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Combobox } from "@/components/ui/combobox"
import { COUNTRIES } from "@/lib/data/countries-languages"
import { ShimmerButton } from "@/components/library/shimmer-button"

interface IdentityStepProps {
    onNext: (data: any) => void
    initialData?: any
}


export function IdentityStep({ onNext, initialData }: IdentityStepProps) {
    const [firstName, setFirstName] = useState(initialData?.firstName || "")
    const [lastName, setLastName] = useState(initialData?.lastName || "")
    const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || "")
    const [about, setAbout] = useState(initialData?.about || "")
    const [birthday, setBirthday] = useState<Date | undefined>(initialData?.birthday ? new Date(initialData.birthday) : undefined)
    const [birthCountry, setBirthCountry] = useState(initialData?.birthCountry || "")
    const [currentCountry, setCurrentCountry] = useState(initialData?.currentCountry || "")

    console.log('[IdentityStep] initialData:', initialData)
    console.log('[IdentityStep] birthCountry state:', birthCountry)
    console.log('[IdentityStep] currentCountry state:', currentCountry)

    const [isUploading, setIsUploading] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (initialData) {
            setFirstName(initialData.firstName || "")
            setLastName(initialData.lastName || "")
            setAvatarUrl(initialData.avatarUrl || "")
            setAbout(initialData.about || "")
            setBirthday(initialData.birthday ? new Date(initialData.birthday) : undefined)
            setBirthCountry(initialData.birthCountry || "")
            setCurrentCountry(initialData.currentCountry || "")
        }
    }, [initialData])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Upload failed")

            const { url } = await response.json()
            setAvatarUrl(url)

            toast({
                description: "Profile photo updated successfully",
            })
        } catch (error) {
            console.error("Upload error:", error)
            toast({
                title: "Upload failed",
                description: "Failed to upload image. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
            // Reset input
            e.target.value = ""
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext({
            firstName,
            lastName,
            avatarUrl,
            about,
            birthday: birthday?.toISOString(),
            birthCountry,
            currentCountry
        })
    }

    const initials = [firstName, lastName]
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-primary">Let's get to know you</h2>
                <p className="text-muted-foreground text-sm">
                    Help your neighbors learn who you are
                </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative group cursor-pointer">
                        <Avatar className="h-20 w-20 border-2 border-border group-hover:border-primary transition-colors">
                            <AvatarImage src={avatarUrl} className="object-cover" />
                            <AvatarFallback className="text-lg bg-muted">
                                {initials || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <label
                            htmlFor="avatar-upload"
                            className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer"
                        >
                            {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                        </label>
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Click to upload photo</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Jane"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="about">About Me</Label>
                    <Textarea
                        id="about"
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        placeholder="Share a brief bio..."
                        className="resize-none h-24"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Birthday</Label>
                    <DateTimePicker date={birthday} setDate={setBirthday} placeholder="Select your birthday" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Country of Origin</Label>
                        <Combobox
                            options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                            value={birthCountry}
                            onValueChange={setBirthCountry}
                            placeholder="Select country"
                            searchPlaceholder="Search countries..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Current Country</Label>
                        <Combobox
                            options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                            value={currentCountry}
                            onValueChange={setCurrentCountry}
                            placeholder="Select country"
                            searchPlaceholder="Search countries..."
                        />
                    </div>
                </div>

                <ShimmerButton
                    type="submit"
                    className="w-full h-12"
                    disabled={!firstName || !lastName || isUploading}
                    background="hsl(var(--primary))"
                >
                    Continue
                </ShimmerButton>
            </form>
        </div>
    )
}
