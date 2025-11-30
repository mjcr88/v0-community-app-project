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
                    <Select value={data.difficulty || ''} onValueChange={(v) => updateField('difficulty', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Surface</Label>
                    <Select value={data.surface || ''} onValueChange={(v) => updateField('surface', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="paved">Paved</SelectItem>
                            <SelectItem value="gravel">Gravel</SelectItem>
                            <SelectItem value="dirt">Dirt</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
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
                        step="0.1"
                        value={data.pathLength || ''}
                        onChange={(e) => updateField('pathLength', e.target.value)}
                        placeholder="2.5"
                        className="flex-1"
                    />
                    <Select
                        value={data.pathLengthUnit || 'km'}
                        onValueChange={(v) => updateField('pathLengthUnit', v)}
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
                        value={data.elevationGain || ''}
                        onChange={(e) => updateField('elevationGain', e.target.value)}
                        placeholder="150"
                        className="flex-1"
                    />
                    <Select
                        value={data.elevationUnit || 'm'}
                        onValueChange={(v) => updateField('elevationUnit', v)}
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
                    onHeroChange={(heroPhoto) => updateField('heroPhoto', heroPhoto)}
                />
            </div>
        </div>
    );
}
