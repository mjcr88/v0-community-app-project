import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhotoManager } from "@/components/photo-manager"
import { getCategoryEmoji } from "@/lib/exchange-category-emojis"

interface Step2BasicInfoProps {
    formData: {
        title: string
        description: string
        category_id: string
        photos: string[]
        hero_photo: string | null
    }
    categories: Array<{ id: string; name: string }>
    tenantId: string
    onUpdate: (data: Partial<Step2BasicInfoProps["formData"]>) => void
}

export function Step2BasicInfo({
    formData,
    categories,
    tenantId,
    onUpdate,
}: Step2BasicInfoProps) {
    return (
        <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="e.g., Cordless Drill, Fresh Tomatoes, Bike Repair Service"
                    maxLength={100}
                    required
                />
                <p className="text-xs text-muted-foreground">
                    {formData.title.length}/100 characters
                </p>
            </div>


            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                    value={formData.description}
                    onChange={(value) => onUpdate({ description: value })}
                    placeholder="Tell your community about this item or service in detail..."
                    className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground">Optional: Share more details to help your neighbors</p>
            </div>



            {/* Photos */}
            <div className="space-y-2">
                <PhotoManager
                    photos={formData.photos}
                    heroPhoto={formData.hero_photo}
                    onPhotosChange={(photos) => onUpdate({ photos })}
                    onHeroPhotoChange={(heroPhoto) => onUpdate({ hero_photo: heroPhoto })}
                    maxPhotos={5}
                />
            </div>
        </div>
    )
}
