import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhotoManager } from "@/components/photo-manager"
import { getCategoryEmoji } from "@/lib/exchange-category-emojis"

interface Step1BasicInfoProps {
    formData: {
        title: string
        description: string
        category_id: string
        photos: string[]
        hero_photo: string | null
    }
    categories: Array<{ id: string; name: string }>
    tenantId: string
    onUpdate: (data: Partial<Step1BasicInfoProps["formData"]>) => void
}

export function Step1BasicInfo({
    formData,
    categories,
    tenantId,
    onUpdate,
}: Step1BasicInfoProps) {
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

            {/* Category */}
            <div className="space-y-2">
                <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                </Label>
                <Select
                    value={formData.category_id}
                    onValueChange={(value) => onUpdate({ category_id: value })}
                    required
                >
                    <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                <span className="flex items-center gap-2">
                                    <span>{getCategoryEmoji(category.name)}</span>
                                    <span>{category.name}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
