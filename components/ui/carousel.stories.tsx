import type { Meta, StoryObj } from "@storybook/react" // turbo
import Carousel from "./carousel"
import { FiHome, FiTool, FiCoffee, FiTruck, FiBook } from "react-icons/fi"

const meta: Meta<typeof Carousel> = {
    title: "UI/Carousel",
    component: Carousel,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Carousel>

const demoItems = [
    {
        title: "Household Items",
        description: "Share furniture, decor, appliances...",
        id: 1,
        icon: <FiHome className="h-4 w-4 text-black" />,
    },
    {
        title: "Tools & Equipment",
        description: "Share ladders, drills, garden tools...",
        id: 2,
        icon: <FiTool className="h-4 w-4 text-black" />,
    },
    {
        title: "Services & Skills",
        description: "Offer tutoring, repairs, pet sitting...",
        id: 3,
        icon: <FiCoffee className="h-4 w-4 text-black" />,
    },
    {
        title: "Rides & Carpooling",
        description: "Share rides to events or commutes",
        id: 4,
        icon: <FiTruck className="h-4 w-4 text-black" />,
    },
    {
        title: "Books & Media",
        description: "Share books, DVDs, and other media",
        id: 5,
        icon: <FiBook className="h-4 w-4 text-black" />,
    },
]

export const Default: Story = {
    args: {
        items: demoItems,
        baseWidth: 300,
        autoplay: false,
        loop: true,
        round: false,
    },
}

export const Autoplay: Story = {
    args: {
        items: demoItems,
        baseWidth: 300,
        autoplay: true,
        autoplayDelay: 2000,
        loop: true,
    },
}
