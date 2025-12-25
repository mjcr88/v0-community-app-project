// Exchange category emoji mapping
export const EXCHANGE_CATEGORY_EMOJIS: Record<string, string> = {
    "Tools & Equipment": "🔧",
    "Food & Produce": "🍎",
    "Household items": "🏡",
    "Services & Skills": "💼",
    "House sitting & Rentals": "🏠",
    "Rides & Carpooling": "🚗",
    "Clothing & Accessories": "👔",
    "Books & Media": "📚",
    "Health & Wellness": "❤️",
}

export function getCategoryEmoji(categoryName: string): string {
    return EXCHANGE_CATEGORY_EMOJIS[categoryName] || "✨"
}
