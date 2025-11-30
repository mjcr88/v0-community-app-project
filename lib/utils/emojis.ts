export const CHECK_IN_EMOJIS: Record<string, string> = {
    coffee: "☕",
    working: "💻",
    socializing: "👋",
    exercise: "🏃",
    games: "🎮",
    meal: "🍽️",
    relaxing: "🧘",
    other: "📍",
}

export function getCheckInEmoji(activityType: string): string {
    return CHECK_IN_EMOJIS[activityType] || "📍"
}

export function getExchangeCategoryEmoji(categoryName: string): string {
    if (!categoryName) return "📦"

    const lowerName = categoryName.toLowerCase()
    if (lowerName.includes("tool")) return "🔧"
    if (lowerName.includes("kitchen") || lowerName.includes("cook")) return "🍳"
    if (lowerName.includes("electronic") || lowerName.includes("tech")) return "🔌"
    if (lowerName.includes("sport") || lowerName.includes("game")) return "⚽"
    if (lowerName.includes("book") || lowerName.includes("read")) return "📚"
    if (lowerName.includes("garden") || lowerName.includes("plant")) return "🌱"
    if (lowerName.includes("child") || lowerName.includes("baby") || lowerName.includes("toy")) return "🧸"
    if (lowerName.includes("cloth") || lowerName.includes("wear")) return "👕"
    if (lowerName.includes("furniture")) return "🪑"
    if (lowerName.includes("vehicle") || lowerName.includes("car") || lowerName.includes("bike")) return "🚗"
    if (lowerName.includes("music") || lowerName.includes("instrument")) return "🎵"
    if (lowerName.includes("pet") || lowerName.includes("animal")) return "🐾"

    return "📦"
}

export function getEventCategoryEmoji(categoryName: string): string {
    if (!categoryName) return "📅"

    const lowerName = categoryName.toLowerCase()
    if (lowerName.includes("party") || lowerName.includes("birthday") || lowerName.includes("celebration")) return "🎉"
    if (lowerName.includes("meetup") || lowerName.includes("gathering") || lowerName.includes("social")) return "👋"
    if (lowerName.includes("sport") || lowerName.includes("game") || lowerName.includes("exercise")) return "⚽"
    if (lowerName.includes("food") || lowerName.includes("dinner") || lowerName.includes("lunch")) return "🍽️"
    if (lowerName.includes("music") || lowerName.includes("concert")) return "🎵"
    if (lowerName.includes("movie") || lowerName.includes("film")) return "🎬"
    if (lowerName.includes("learn") || lowerName.includes("class") || lowerName.includes("workshop")) return "🎓"
    if (lowerName.includes("market") || lowerName.includes("sale")) return "🛍️"
    if (lowerName.includes("clean") || lowerName.includes("fix")) return "🧹"

    return "📅"
}
