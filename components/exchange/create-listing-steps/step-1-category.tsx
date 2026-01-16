import React, { useMemo, useCallback } from "react"
import { motion } from "motion/react"
import Carousel from "@/components/ui/carousel"
import { getCategoryEmoji } from "@/lib/exchange-category-emojis"
import { cn } from "@/lib/utils"

interface Step1CategoryProps {
    formData: {
        category_id: string
    }
    categories: Array<{ id: string; name: string; description?: string }>
    onUpdate: (data: { category_id: string }) => void
    onNext: () => void
}

export function Step1Category({
    formData,
    categories,
    onUpdate,
    onNext,
}: Step1CategoryProps) {
    // Transform categories for Carousel
    const carouselItems = useMemo(() => categories.map((cat, index) => ({
        id: index,
        realId: cat.id,
        title: cat.name,
        description: cat.description || "Tap to select this category",
        // Using larger text size for the emoji icon
        icon: <span style={{ fontSize: '32px', lineHeight: 1 }}>{getCategoryEmoji(cat.name)}</span>,
    })), [categories])

    // Find index of currently selected category
    const initialIndex = useMemo(() =>
        carouselItems.findIndex((c) => c.realId === formData.category_id),
        [carouselItems, formData.category_id]
    )

    // State for the current category description
    const [currentDescription, setCurrentDescription] = React.useState("")

    const handleIndexChange = useCallback((index: number, description: string) => {
        setCurrentDescription(description)
        const item = carouselItems[index]
        if (item) {
            // Only update if changed to avoid unnecessary re-renders
            if (item.realId !== formData.category_id) {
                onUpdate({ category_id: item.realId })
            }
        }
    }, [carouselItems, formData.category_id, onUpdate])

    const handleItemClick = useCallback((index: number) => {
        const item = carouselItems[index]
        if (item) {
            onUpdate({ category_id: item.realId })
            onNext()
        }
    }, [carouselItems, onUpdate, onNext])

    // Set initial description
    React.useEffect(() => {
        if (initialIndex >= 0 && carouselItems[initialIndex]) {
            setCurrentDescription(carouselItems[initialIndex].description)
        } else if (carouselItems.length > 0) {
            setCurrentDescription(carouselItems[0].description)
        }
    }, [initialIndex, carouselItems])


    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">What kind of listing is this?</h3>
                <p className="text-sm text-muted-foreground">
                    Swipe to select a category
                </p>
            </div>

            <div className="w-full flex flex-col items-center justify-center p-0 overflow-hidden">
                <div className="h-[280px] w-full flex justify-center items-center overflow-hidden" style={{ touchAction: 'pan-y' }}>
                    <Carousel
                        items={carouselItems}
                        baseWidth={260}
                        autoplay={false}
                        loop={true}
                        round={false}
                        onIndexChange={handleIndexChange}
                        onItemClick={handleItemClick}
                    />
                </div>

                {/* Description Text below the carousel (and dots) */}
                <div className="h-8 mt-6 text-center px-4">
                    <p className="text-sm text-muted-foreground font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 key={currentDescription}">
                        {currentDescription}
                    </p>
                </div>
            </div>

            {/* Removed the "Selected: Category Name" text as requested */}
        </div>
    )
}
