import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface KeysStepProps {
    onNext: (data: any) => void
    initialData?: any
}

export function KeysStep({ onNext, initialData }: KeysStepProps) {
    const { toast } = useToast()
    const [firstName, setFirstName] = useState(initialData?.firstName || "")
    const [lastName, setLastName] = useState(initialData?.lastName || "")
    const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || "")
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        if (initialData) {
            setFirstName((prev: string) => prev || initialData.firstName || "")
            setLastName((prev: string) => prev || initialData.lastName || "")
            setAvatarUrl((prev: string) => prev || initialData.avatarUrl || "")
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
        onNext({ firstName, lastName, avatarUrl })
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-primary">Let's start with the keys</h2>
                <p className="text-muted-foreground">
                    How should we introduce you to your neighbors?
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">

                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="relative group cursor-pointer"
                        onClick={() => !isUploading && document.getElementById("avatar-upload")?.click()}
                    >
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                            <AvatarImage src={avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-orange-100 text-orange-600 text-xl font-bold">
                                {firstName?.[0]}{lastName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-md group-hover:scale-110 transition-transform">
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Camera className="h-4 w-4" />
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Tap to upload photo</p>
                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
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
                            className="h-12"
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
                            className="h-12"
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 text-lg" disabled={!firstName || !lastName || isUploading}>
                    Continue
                </Button>
            </form>
        </div>
    )
}
