"use client"

import { useLocale } from "@/lib/i18n"
import { Globe } from "lucide-react"

const languages = [
    { code: "en" as const, label: "English", display: "English", flag: "🇺🇸" },
    { code: "es" as const, label: "Español", display: "Español", flag: "🇪🇸" },
]

interface LanguageToggleProps {
    className?: string
}

export function LanguageToggle({ className }: LanguageToggleProps) {
    const { locale, setLocale } = useLocale()

    const toggleLanguage = () => {
        const newLocale = locale === "en" ? "es" : "en"
        setLocale(newLocale)
    }

    const currentLanguage = languages.find(l => l.code === locale)

    return (
        <button
            onClick={toggleLanguage}
            className={className}
            title={locale === "en" ? "Switch to Spanish" : "Switch to English"}
        >
            <Globe className="mr-2 h-4 w-4" />
            {currentLanguage?.display || "Language"}
        </button>
    )
}
