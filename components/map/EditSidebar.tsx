'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, Building2, Home, Route, Trash2 } from 'lucide-react';
import { FacilityFields } from './form-fields/FacilityFields';
import { LotFields } from './form-fields/LotFields';
import { WalkingPathFields } from './form-fields/WalkingPathFields';

type LocationType = 'facility' | 'lot' | 'walking_path';

interface EditSidebarProps {
    mode: 'create' | 'edit';
    locationType: LocationType | null;
    locationId?: string;
    geometry: any;
    initialData: any;
    lots: any[];
    onTypeSelect?: (type: LocationType) => void;
    onSave: (data: any) => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
}

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function EditSidebar({
    mode,
    locationType,
    locationId,
    geometry,
    initialData,
    lots,
    onTypeSelect,
    onSave,
    onCancel,
    onDelete,
}: EditSidebarProps) {
    const [selectedType, setSelectedType] = useState<LocationType | null>(locationType);
    const [formData, setFormData] = useState<any>(initialData || {});
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Only update formData when switching locations (id change) or on initial mount
    // Don't reset on every initialData change to preserve user edits (like photo uploads)
    useEffect(() => {
        setSelectedType(locationType);

        // Only reset formData if we're switching to a different location
        // or if formData is empty (initial mount)
        if (!formData.id || formData.id !== initialData?.id) {
            setFormData(initialData || {});
        }
    }, [locationType, initialData?.id]); // Only depend on id, not entire initialData object

    const handleTypeChange = (type: LocationType) => {
        setSelectedType(type);
        if (onTypeSelect) {
            onTypeSelect(type);
        }
    };

    const handleSave = () => {
        onSave({
            ...formData,
            type: selectedType,
        });
    };

    const renderFormFields = () => {
        switch (selectedType) {
            case 'facility':
                return <FacilityFields data={formData} onChange={setFormData} />;
            case 'lot':
                return <LotFields data={formData} onChange={setFormData} lots={lots} />;
            case 'walking_path':
                return <WalkingPathFields data={formData} onChange={setFormData} />;
            default:
                return null;
        }
    };

    const getTitle = () => {
        if (mode === 'create') return 'New Location';
        switch (selectedType) {
            case 'facility': return 'Edit Facility';
            case 'lot': return 'Edit Lot';
            case 'walking_path': return 'Edit Walking Path';
            default: return 'Edit Location';
        }
    };

    return (
        <div className="absolute top-0 right-0 h-full w-96 bg-background dark:bg-card border-l border-border shadow-lg flex flex-col z-20 animate-in slide-in-from-right duration-300">
            {/* Sticky Header */}
            <div className="p-4 border-b border-border bg-background dark:bg-card z-10 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-semibold">{getTitle()}</h2>
                <Button variant="ghost" size="icon" onClick={onCancel}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Location Type Selector (create mode only) */}
                {mode === 'create' && !selectedType && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                        <Label className="text-base">Select Location Type</Label>
                        <RadioGroup value={selectedType || ''} onValueChange={(v) => handleTypeChange(v as LocationType)}>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="facility" />
                                    <div className="bg-orange-100 p-2 rounded-md text-orange-600">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Facility</div>
                                        <div className="text-xs text-muted-foreground">
                                            Pool, gym, clubhouse, etc.
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="lot" />
                                    <div className="bg-blue-100 p-2 rounded-md text-blue-600">
                                        <Home className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Lot</div>
                                        <div className="text-xs text-muted-foreground">
                                            Resident property boundary
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="walking_path" />
                                    <div className="bg-green-100 p-2 rounded-md text-green-600">
                                        <Route className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Walking Path</div>
                                        <div className="text-xs text-muted-foreground">
                                            Trail or pathway
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </RadioGroup>
                    </div>
                )}

                {/* Form Fields */}
                {selectedType && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {renderFormFields()}
                    </div>
                )}
            </div>

            {/* Sticky Footer */}
            {selectedType && (
                <div className="p-4 border-t border-border bg-background dark:bg-card z-10 shrink-0 space-y-2">
                    <div className="flex gap-2">
                        <Button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                            {mode === 'create' ? 'Create Location' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>

                    {mode === 'edit' && locationId && (
                        <>
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Location
                            </Button>

                            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the location
                                            and remove it from the map.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => {
                                                onDelete(locationId);
                                                setIsDeleteDialogOpen(false);
                                            }}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
