'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Building2, Home, Route, Trash2 } from 'lucide-react';
import { FacilityFields } from './form-fields/FacilityFields';
import { LotFields } from './form-fields/LotFields';
import { WalkingPathFields } from './form-fields/WalkingPathFields';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LocationType = 'facility' | 'lot' | 'walking_path';

interface EditLocationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
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

export function EditLocationDialog({
    open,
    onOpenChange,
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
}: EditLocationDialogProps) {
    const [selectedType, setSelectedType] = useState<LocationType | null>(locationType);
    const [formData, setFormData] = useState<any>(initialData || {});
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Only update formData when switching locations (id change) or on initial mount
    useEffect(() => {
        if (open) {
            setSelectedType(locationType);
            if (!formData.id || formData.id !== initialData?.id) {
                setFormData(initialData || {});
            }
        }
    }, [open, locationType, initialData?.id]);

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                    <DialogDescription>
                        {mode === 'create' ? 'Add a new location to the map.' : 'Make changes to the location details.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Location Type Selector (create mode only) */}
                    {mode === 'create' && !selectedType && (
                        <div className="space-y-3">
                            <Label className="text-base">Select Location Type</Label>
                            <RadioGroup value={selectedType || ''} onValueChange={(v) => handleTypeChange(v as LocationType)}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <label className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors text-center">
                                        <RadioGroupItem value="facility" className="sr-only" />
                                        <div className="bg-orange-100 p-2 rounded-md text-orange-600">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Facility</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Pool, gym, etc.
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors text-center">
                                        <RadioGroupItem value="lot" className="sr-only" />
                                        <div className="bg-blue-100 p-2 rounded-md text-blue-600">
                                            <Home className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Lot</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Resident property
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors text-center">
                                        <RadioGroupItem value="walking_path" className="sr-only" />
                                        <div className="bg-green-100 p-2 rounded-md text-green-600">
                                            <Route className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Walking Path</div>
                                            <div className="text-xs text-muted-foreground mt-1">
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

                <DialogFooter className="flex gap-2 sm:justify-between">
                    {mode === 'edit' && locationId ? (
                        <Button
                            variant="destructive"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            type="button"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Location
                        </Button>
                    ) : <div></div>}

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {mode === 'create' ? 'Create Location' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogFooter>

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
                                    onDelete(locationId!);
                                    setIsDeleteDialogOpen(false);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    );
}
