'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoManager } from '@/components/photo-manager';

interface Lot {
    id: string;
    lot_number: string;
    address: string | null;
    neighborhoods: { name: string } | null;
}

interface LotFieldsProps {
    data: any;
    onChange: (data: any) => void;
    lots: Lot[];
}

export function LotFields({ data, onChange, lots }: LotFieldsProps) {
    const updateField = (field: string, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const handleLotSelect = (lotId: string) => {
        const lot = lots.find((l) => l.id === lotId);
        onChange({
            ...data,
            lot_id: lotId, // Use snake_case to match database
            name: lot?.lot_number || '',
        });
    };

    return (
        <div className="space-y-4">
            {/* Lot Selector */}
            <div className="space-y-2">
                <Label>Select Lot *</Label>
                <Select value={data.lot_id || ''} onValueChange={handleLotSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a lot..." />
                    </SelectTrigger>
                    <SelectContent>
                        {lots.map((lot) => (
                            <SelectItem key={lot.id} value={lot.id}>
                                {lot.lot_number}
                                {lot.neighborhoods?.name && ` (${lot.neighborhoods.name})`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Name (editable) */}
            <div className="space-y-2">
                <Label>Name</Label>
                <Input
                    value={data.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Lot number or custom name"
                />
                <p className="text-xs text-muted-foreground">
                    You can customize the display name
                </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                    value={data.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                />
            </div>

            {/* Photos */}
            <div className="space-y-2">
                <Label>Photos</Label>
                <PhotoManager
                    photos={data.photos || []}
                    heroPhoto={data.heroPhoto}
                    onPhotosChange={(photos) => updateField('photos', photos)}
                    onHeroPhotoChange={(heroPhoto) => updateField('heroPhoto', heroPhoto)}
                />
            </div>
        </div>
    );
}
