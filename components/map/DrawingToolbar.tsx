'use client';

import { Button } from '@/components/ui/button';
import { MapPin, Route, Pentagon, Undo, Check, Trash2 } from 'lucide-react';

type DrawMode = 'point' | 'line' | 'polygon' | null;

interface DrawingToolbarProps {
    onDrawPoint: () => void;
    onDrawLine: () => void;
    onDrawPolygon: () => void;
    onUndo: () => void;
    onFinish: () => void;
    onClear: () => void;
    activeMode: DrawMode;
    canUndo: boolean;
    canFinish: boolean;
}

interface DrawingToolbarInternalProps extends DrawingToolbarProps {
    sidebarOpen?: boolean;
}

export function DrawingToolbar({
    onDrawPoint,
    onDrawLine,
    onDrawPolygon,
    onUndo,
    onFinish,
    onClear,
    activeMode,
    canUndo,
    canFinish,
    sidebarOpen = false,
}: DrawingToolbarInternalProps) {
    return (
        <div className="absolute top-[100px] left-1/2 -translate-x-1/2 flex flex-row items-center gap-2 z-[1000] bg-white rounded-md shadow-md p-1">
            {/* Draw Point */}
            <Button
                size="icon"
                className={`h-[29px] w-[29px] rounded transition-colors ${activeMode === 'point'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-transparent text-gray-900 hover:bg-gray-100'
                    }`}
                onClick={onDrawPoint}
                title="Drop Pin"
            >
                <MapPin className="h-4 w-4" />
            </Button>

            {/* Draw Line */}
            <Button
                size="icon"
                className={`h-[29px] w-[29px] rounded transition-colors ${activeMode === 'line'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-transparent text-gray-900 hover:bg-gray-100'
                    }`}
                onClick={onDrawLine}
                title="Draw Line"
            >
                <Route className="h-4 w-4" />
            </Button>

            {/* Draw Polygon */}
            <Button
                size="icon"
                className={`h-[29px] w-[29px] rounded transition-colors ${activeMode === 'polygon'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-transparent text-gray-900 hover:bg-gray-100'
                    }`}
                onClick={onDrawPolygon}
                title="Draw Polygon"
            >
                <Pentagon className="h-4 w-4" />
            </Button>

            {/* Separator */}
            <div className="w-px bg-gray-300 h-5" />

            {/* Undo */}
            <Button
                size="icon"
                className="h-[29px] w-[29px] rounded bg-transparent text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo"
            >
                <Undo className="h-4 w-4" />
            </Button>

            {/* Finish */}
            <Button
                size="icon"
                className="h-[29px] w-[29px] rounded bg-transparent text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                onClick={onFinish}
                disabled={!canFinish}
                title="Finish"
            >
                <Check className="h-4 w-4" />
            </Button>

            {/* Clear */}
            <Button
                size="icon"
                className="h-[29px] w-[29px] rounded bg-transparent text-gray-900 hover:bg-gray-100"
                onClick={onClear}
                title="Clear"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
