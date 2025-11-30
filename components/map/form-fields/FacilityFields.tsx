'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { PhotoManager } from '@/components/photo-manager';

interface FacilityFieldsProps {
    data: any;
    onChange: (data: any) => void;
}

export function FacilityFields({ data, onChange }: FacilityFieldsProps) {
    const updateField = (field: string, value: any) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-4">
            {/* Essential Fields - Always Visible */}
            <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                    value={data.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Community Pool"
                />
            </div>

            <div className="space-y-2">
                <Label>Facility Type</Label>
                <Input
                    value={data.facilityType || ''}
                    onChange={(e) => updateField('facilityType', e.target.value)}
                    placeholder="e.g., Pool, Gym, Clubhouse"
                />
            </div>

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
                    onHeroChange={(heroPhoto) => updateField('heroPhoto', heroPhoto)}
                />
            </div>

            {/* Advanced Fields - Accordion */}
            <Accordion type="single" collapsible>
                <AccordionItem value="details" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="font-medium">Facility Details</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        {/* Capacity & Occupancy */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Capacity & Occupancy</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Capacity</Label>
                                    <Input
                                        type="number"
                                        value={data.capacity || ''}
                                        onChange={(e) => updateField('capacity', e.target.value)}
                                        placeholder="50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Max Occupancy</Label>
                                    <Input
                                        type="number"
                                        value={data.maxOccupancy || ''}
                                        onChange={(e) => updateField('maxOccupancy', e.target.value)}
                                        placeholder="75"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Amenities</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'wifi', label: 'WiFi' },
                                    { id: 'restrooms', label: 'Restrooms' },
                                    { id: 'parking', label: 'Parking' },
                                    { id: 'wheelchair', label: 'Wheelchair Accessible' },
                                    { id: 'petFriendly', label: 'Pet Friendly' },
                                    { id: 'kitchen', label: 'Kitchen' },
                                    { id: 'ac', label: 'Air Conditioning' },
                                    { id: 'bbq', label: 'BBQ/Grill' },
                                ].map((amenity) => (
                                    <div key={amenity.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={amenity.id}
                                            checked={data.amenities?.[amenity.id] || false}
                                            onCheckedChange={(checked) =>
                                                updateField('amenities', {
                                                    ...(data.amenities || {}),
                                                    [amenity.id]: checked,
                                                })
                                            }
                                        />
                                        <label
                                            htmlFor={amenity.id}
                                            className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {amenity.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label className="text-xs">Status</Label>
                            <Select value={data.status || ''} onValueChange={(v) => updateField('status', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                    <SelectItem value="coming_soon">Coming Soon</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Parking */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Parking</h4>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="parkingAvailable"
                                    checked={data.parkingAvailable || false}
                                    onCheckedChange={(checked) => updateField('parkingAvailable', checked)}
                                />
                                <label
                                    htmlFor="parkingAvailable"
                                    className="text-xs font-normal leading-none"
                                >
                                    Parking Available
                                </label>
                            </div>
                            {data.parkingAvailable && (
                                <div className="space-y-2">
                                    <Label className="text-xs">Parking Spaces</Label>
                                    <Input
                                        type="number"
                                        value={data.parkingSpaces || ''}
                                        onChange={(e) => updateField('parkingSpaces', e.target.value)}
                                        placeholder="10"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Accessibility */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Accessibility</h4>
                            <div className="space-y-2">
                                {[
                                    { id: 'wheelchairRamp', label: 'Wheelchair Ramp' },
                                    { id: 'accessibleParking', label: 'Accessible Parking' },
                                    { id: 'accessibleRestrooms', label: 'Accessible Restrooms' },
                                    { id: 'brailleSignage', label: 'Braille Signage' },
                                ].map((feature) => (
                                    <div key={feature.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={feature.id}
                                            checked={data.accessibilityFeatures?.[feature.id] || false}
                                            onCheckedChange={(checked) =>
                                                updateField('accessibilityFeatures', {
                                                    ...(data.accessibilityFeatures || {}),
                                                    [feature.id]: checked,
                                                })
                                            }
                                        />
                                        <label
                                            htmlFor={feature.id}
                                            className="text-xs font-normal leading-none"
                                        >
                                            {feature.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Accessibility Notes</Label>
                                <Textarea
                                    value={data.accessibilityNotes || ''}
                                    onChange={(e) => updateField('accessibilityNotes', e.target.value)}
                                    placeholder="Additional accessibility information..."
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="space-y-2">
                            <Label className="text-xs">Rules & Guidelines</Label>
                            <Textarea
                                value={data.rules || ''}
                                onChange={(e) => updateField('rules', e.target.value)}
                                placeholder="Facility rules and guidelines..."
                                rows={3}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
