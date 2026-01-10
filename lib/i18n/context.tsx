"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import en from "./en.json"
import es from "./es.json"

type Locale = "en" | "es"

type TranslationValue = string | { [key: string]: TranslationValue }

interface Translations {
    [key: string]: TranslationValue
}

const translations: Record<Locale, Translations> = { en, es }

interface LanguageContextType {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = "preferred-language"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("en")
    const [mounted, setMounted] = useState(false)

    // Load saved preference on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
        if (saved && (saved === "en" || saved === "es")) {
            setLocaleState(saved)
        }
        setMounted(true)
    }, [])

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale)
        localStorage.setItem(STORAGE_KEY, newLocale)
    }, [])

    const t = useCallback(
        (key: string): string => {
            const keys = key.split(".")
            let value: TranslationValue = translations[locale]

            for (const k of keys) {
                if (typeof value === "object" && value !== null && k in value) {
                    value = value[k]
                } else {
                    // Fallback to English if key not found
                    let fallback: TranslationValue = translations.en
                    for (const fk of keys) {
                        if (typeof fallback === "object" && fallback !== null && fk in fallback) {
                            fallback = fallback[fk]
                        } else {
                            return key // Return key if not found in fallback either
                        }
                    }
                    return typeof fallback === "string" ? fallback : key
                }
            }

            return typeof value === "string" ? value : key
        },
        [locale]
    )

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useTranslation() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useTranslation must be used within a LanguageProvider")
    }
    return context
}

export function useLocale() {
    const { locale, setLocale } = useTranslation()
    return { locale, setLocale }
}
