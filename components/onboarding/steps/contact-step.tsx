"use client"

import { Button } from "@/components/ui/button"
import { ShimmerButton } from "@/components/library/shimmer-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Mail, Phone, X } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { Badge } from "@/components/ui/badge"
import { LANGUAGES } from "@/lib/data/countries-languages"

interface ContactStepProps {
    onNext: (data: any) => void
    onBack: () => void
    initialData?: any
}

export function ContactStep({ onNext, onBack, initialData }: ContactStepProps) {
    const [email, setEmail] = useState(initialData?.email || "")
    const [phone, setPhone] = useState(initialData?.phone || "")
    const [languages, setLanguages] = useState<string[]>(initialData?.languages || [])
    const [preferredLanguage, setPreferredLanguage] = useState(initialData?.preferredLanguage || "")
    const [languageSearch, setLanguageSearch] = useState("")

    useEffect(() => {
        if (initialData) {
            setEmail(initialData.email || "")
            setPhone(initialData.phone || "")
            setLanguages(initialData.languages || [])
            setPreferredLanguage(initialData.preferredLanguage || "")
        }
    }, [initialData])

    const addLanguage = (lang: string) => {
        if (lang && !languages.includes(lang)) {
            setLanguages([...languages, lang])
            setLanguageSearch("")
        }
    }

    const removeLanguage = (lang: string) => {
        setLanguages(languages.filter((l) => l !== lang))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext({ email, phone, languages, preferredLanguage })
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-primary">How can neighbors reach you?</h2>
                <p className="text-muted-foreground">
                    Share your contact details and language preferences
                </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-9"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="pl-9"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                    <Label>Languages You Speak</Label>
                    <Combobox
                        options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                        value={languageSearch}
                        onValueChange={(value) => {
                            addLanguage(value)
                        }}
                        placeholder="Add a language"
                        searchPlaceholder="Search languages..."
                    />
                    {languages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {languages.map((language) => (
                                <Badge key={language} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                                    {language}
                                    <button
                                        type="button"
                                        onClick={() => removeLanguage(language)}
                                        className="ml-1 hover:text-destructive rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Preferred Language</Label>
                    <Combobox
                        options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                        value={preferredLanguage}
                        onValueChange={setPreferredLanguage}
                        placeholder="Select preferred language"
                        searchPlaceholder="Search languages..."
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onBack} className="flex-1 h-12">Back</Button>
                    <ShimmerButton type="submit" className="flex-1 h-12" disabled={!email} background="hsl(var(--primary))">
                        Continue
                    </ShimmerButton>
                </div>
            </form>
        </div>
    )
}
