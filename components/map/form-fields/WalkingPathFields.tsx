'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoManager } from '@/components/photo-manager';

interface WalkingPathFieldsProps {
    data: any;
    onChange: (data: any) => void;
}

export function WalkingPathFields({ data, onChange }: WalkingPathFieldsProps) {
    const updateField = (field: string, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const toMeters = (value: number, unit: string) => {
        if (!value) return null;
        if (unit === 'mi') return value * 1609.34;
        if (unit === 'ft') return value * 0.3048;
        if (unit === 'km') return value * 1000;
        return value; // 'm' or undefined
    };

    const fromMeters = (meters: number, unit: string) => {
        if (!meters) return '';
        if (unit === 'mi') return (meters / 1609.34).toFixed(2);
        if (unit === 'ft') return (meters / 0.3048).toFixed(1);
        if (unit === 'km') return (meters / 1000).toFixed(2);
        return Math.round(meters).toString();
    };

    return (
        <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                    value={data.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Forest Trail"
                />
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

            {/* Path Characteristics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={(data.path_difficulty || '').toLowerCase()} onValueChange={(v) => updateField('path_difficulty', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="difficult">Difficult</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Surface</Label>
                    <Select value={(data.path_surface || '').toLowerCase()} onValueChange={(v) => updateField('path_surface', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="paved">Paved</SelectItem>
                            <SelectItem value="gravel">Gravel</SelectItem>
                            <SelectItem value="dirt">Dirt</SelectItem>
                            <SelectItem value="natural">Natural</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Path Length */}
            <div className="space-y-2">
                <Label>Path Length</Label>
                <div className="flex gap-2">
                    <Input
                        type="number"
                        step="0.01"
                        value={fromMeters(data.path_length, data.path_length_unit || 'km')}
                        onChange={(e) => {
                            const displayVal = parseFloat(e.target.value);
                            const meters = toMeters(displayVal, data.path_length_unit || 'km');
                            updateField('path_length', meters);
                        }}
                        placeholder="2.5"
                        className="flex-1"
                    />
                    <Select
                        value={data.path_length_unit || 'km'}
                        onValueChange={(v) => updateField('path_length_unit', v)}
                    >
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="km">km</SelectItem>
                            <SelectItem value="mi">miles</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Elevation Gain */}
            <div className="space-y-2">
                <Label>Elevation Gain</Label>
                <div className="flex gap-2">
                    <Input
                        type="number"
                        value={fromMeters(data.elevation_gain, data.elevation_unit || 'm')}
                        onChange={(e) => {
                            const displayVal = parseFloat(e.target.value);
                            const meters = toMeters(displayVal, data.elevation_unit || 'm');
                            updateField('elevation_gain', meters);
                        }}
                        placeholder="150"
                        className="flex-1"
                    />
                    <Select
                        value={data.elevation_unit || 'm'}
                        onValueChange={(v) => updateField('elevation_unit', v)}
                    >
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="m">m</SelectItem>
                            <SelectItem value="ft">ft</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
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

