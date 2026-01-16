
import type { Meta, StoryObj } from "@storybook/react"
import { EventPhotoGallery, EventHeroImage } from "./event-images-gallery"

const meta = {
    title: "Organisms/Events/EventImagesGallery",
    component: EventPhotoGallery, // Showing gallery primarily
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "Displays event images in a hero and grid layout. Includes `EventHeroImage` and `EventPhotoGallery`.\n\n**Used in:** Event Detail Page (`events/[eventId]/page.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
} satisfies Meta<typeof EventPhotoGallery>

export default meta
type Story = StoryObj<typeof meta>

const mockImages = [
    { id: "1", image_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622", is_hero: true, display_order: 0 },
    { id: "2", image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30", is_hero: false, display_order: 1 },
    { id: "3", image_url: "https://images.unsplash.com/photo-1472653431158-6364773b2729", is_hero: false, display_order: 2 },
    { id: "4", image_url: "https://images.unsplash.com/photo-1543269865-cbf427effbad", is_hero: false, display_order: 3 },
]

export const Default: Story = {
    args: {
        images: mockImages,
        eventTitle: "Community Party",
    },
    decorators: [
        (Story) => (
            <div className="w-[600px]">
                <div className="mb-4">
                    <h4 className="text-sm font-bold mb-2">Hero Image Component:</h4>
                    <EventHeroImage heroImage={mockImages[0]} alt="Hero" />
                </div>
                <div className="border-t pt-4">
                    <h4 className="text-sm font-bold mb-2">Gallery Component:</h4>
                    <Story />
                </div>
            </div>
        )
    ]
}

export const HeroOnly: Story = {
    args: {
        images: [mockImages[0]],
        eventTitle: "Community Party",
    },
    decorators: [
        (Story) => (
            <div className="w-[600px]">
                <div className="mb-4">
                    <h4 className="text-sm font-bold mb-2">Hero Image Component:</h4>
                    <EventHeroImage heroImage={mockImages[0]} alt="Hero" />
                </div>
                <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">Gallery is empty because single image is hero.</p>
                    <Story />
                </div>
            </div>
        )
    ]
}
