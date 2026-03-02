"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Mail, User, Users, MapPin, Check, AlertCircle, Loader2 } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/library/button"
import { Input } from "@/components/library/input"
import { Label } from "@/components/library/label"
import { Alert, AlertDescription } from "@/components/library/alert"
import { ShineBorder } from "@/components/library/shine-border"
import { MagicCard } from "@/components/library/magic-card"
import { Checkbox } from "@/components/library/checkbox"
import { Combobox } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import { accessRequestSchema, type AccessRequestInput } from "@/lib/validation/access-request-schema"

interface RequestAccessFormProps {
    tenant: {
        id: string
        name: string
        slug: string
    }
}

interface LotOption {
    id: string
    lot_number: string
    is_occupied: boolean
}

type FormState = "form" | "success"

function ResponsiveCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <>
            {/* Mobile View */}
            <div className={cn("relative w-full max-w-md rounded-2xl overflow-hidden lg:hidden", className)}>
                <div className="absolute inset-0 bg-earth-snow/90 backdrop-blur-sm z-0" />
                <ShineBorder
                    className="pointer-events-none absolute inset-0 z-10"
                    shineColor={["transparent", "transparent", "#D97742", "#6B9B47", "transparent", "transparent"]}
                    borderWidth={2}
                />
                <div className="relative z-20 h-full w-full">
                    {children}
                </div>
            </div>

            {/* Desktop View */}
            <MagicCard
                className={cn("hidden lg:block w-full max-w-md shadow-xl border-earth-pebble rounded-2xl", className)}
                gradientColor="hsl(var(--forest-growth))"
                gradientFrom="hsl(var(--forest-canopy))"
                gradientTo="hsl(var(--sunrise))"
                gradientOpacity={0.25}
                gradientSize={400}
            >
                <div className="bg-earth-snow/90 backdrop-blur-sm h-full w-full rounded-[inherit]">
                    {children}
                </div>
            </MagicCard>
        </>
    )
}

export function RequestAccessForm({ tenant }: RequestAccessFormProps) {
    const [formState, setFormState] = useState<FormState>("form")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [lots, setLots] = useState<LotOption[]>([])
    const [lotsLoading, setLotsLoading] = useState(true)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    // Form fields
    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [familyName, setFamilyName] = useState("")
    const [selectedLotId, setSelectedLotId] = useState("")
    const [inCostaRica, setInCostaRica] = useState(false)

    // Fetch lots on mount
    useEffect(() => {
        async function fetchLots() {
            try {
                const params = new URLSearchParams({ tenant_slug: tenant.slug })
                const response = await fetch(`/api/v1/lots?${params.toString()}`)
                const data = await response.json()
                if (data.success && Array.isArray(data.data)) {
                    setLots(data.data)
                }
            } catch {
                console.error("[request-access] Failed to fetch lots")
            } finally {
                setLotsLoading(false)
            }
        }
        fetchLots()
    }, [tenant.slug])

    const selectedLot = lots.find((l) => l.id === selectedLotId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setFieldErrors({})
        setLoading(true)

        try {
            // Client-side validation
            const input: AccessRequestInput = {
                email,
                first_name: firstName,
                last_name: lastName,
                family_name: familyName || undefined,
                lot_id: selectedLotId || undefined,
                in_costa_rica: inCostaRica,
            }

            const parseResult = accessRequestSchema.safeParse(input)
            if (!parseResult.success) {
                const errors: Record<string, string> = {}
                parseResult.error.errors.forEach((err) => {
                    const field = err.path[0]?.toString()
                    if (field && !errors[field]) {
                        errors[field] = err.message
                    }
                })
                setFieldErrors(errors)
                setLoading(false)
                return
            }

            // Submit to API
            const response = await fetch("/api/v1/access-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...parseResult.data,
                    tenant_slug: tenant.slug,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error?.message || "Failed to submit request")
                setLoading(false)
                return
            }

            setFormState("success")
        } catch {
            setError("An unexpected error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // Success state
    if (formState === "success") {
        return (
            <ResponsiveCard className="shadow-xl border-earth-pebble">
                <div className="p-8 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-forest-canopy/10"
                    >
                        <Check className="h-8 w-8 text-forest-canopy" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-forest-canopy mb-3">Request Submitted! ✨</h2>
                    <p className="text-mist-gray mb-6">
                        Thank you for your interest in {tenant.name}. An administrator will review
                        your request and get back to you.
                    </p>
                    <Link
                        href={`/t/${tenant.slug}/login`}
                        className="inline-flex items-center text-forest-canopy hover:text-forest-deep hover:underline font-medium transition-colors"
                    >
                        ← Back to login
                    </Link>
                </div>
            </ResponsiveCard>
        )
    }

    return (
        <ResponsiveCard className="shadow-xl border-earth-pebble">
            <div className="p-8">
                <div className="mb-6 text-center flex flex-col items-center">
                    <h2 className="text-2xl font-bold text-forest-canopy mb-2">Request Access 🏡</h2>
                    <div className="relative w-20 h-20 mb-3 lg:hidden">
                        <Image
                            src="/rio/parrot.png"
                            alt="Rio the Parrot"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <p className="text-mist-gray text-sm">
                        Interested in joining {tenant.name}? Fill out the form below and an admin
                        will review your request.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive" className="bg-clay-mist border-clay-red text-clay-red">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Email */}
                    <div className="space-y-1.5">
                        <Label htmlFor="ra-email" className="text-earth-soil font-medium text-sm">
                            Email <span className="text-clay-red">*</span>
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-mist-gray" />
                            <Input
                                id="ra-email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={cn(
                                    "pl-10 border-earth-pebble focus-visible:ring-forest-canopy bg-white",
                                    fieldErrors.email && "border-clay-red"
                                )}
                            />
                        </div>
                        {fieldErrors.email && (
                            <p className="text-xs text-clay-red">{fieldErrors.email}</p>
                        )}
                    </div>

                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="ra-first-name" className="text-earth-soil font-medium text-sm">
                                First Name <span className="text-clay-red">*</span>
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-mist-gray" />
                                <Input
                                    id="ra-first-name"
                                    placeholder="First"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className={cn(
                                        "pl-10 border-earth-pebble focus-visible:ring-forest-canopy bg-white",
                                        fieldErrors.first_name && "border-clay-red"
                                    )}
                                />
                            </div>
                            {fieldErrors.first_name && (
                                <p className="text-xs text-clay-red">{fieldErrors.first_name}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ra-last-name" className="text-earth-soil font-medium text-sm">
                                Last Name <span className="text-clay-red">*</span>
                            </Label>
                            <Input
                                id="ra-last-name"
                                placeholder="Last"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className={cn(
                                    "border-earth-pebble focus-visible:ring-forest-canopy bg-white",
                                    fieldErrors.last_name && "border-clay-red"
                                )}
                            />
                            {fieldErrors.last_name && (
                                <p className="text-xs text-clay-red">{fieldErrors.last_name}</p>
                            )}
                        </div>
                    </div>

                    {/* Family Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="ra-family-name" className="text-earth-soil font-medium text-sm">
                            Family Name <span className="text-mist-gray text-xs">(optional)</span>
                        </Label>
                        <div className="relative">
                            <Users className="absolute left-3 top-3 h-4 w-4 text-mist-gray" />
                            <Input
                                id="ra-family-name"
                                placeholder="e.g., The Smith Family"
                                value={familyName}
                                onChange={(e) => setFamilyName(e.target.value)}
                                className="pl-10 border-earth-pebble focus-visible:ring-forest-canopy bg-white"
                            />
                        </div>
                    </div>

                    {/* Lot Dropdown (Searchable) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="ra-lot" className="text-earth-soil font-medium text-sm">
                            Lot Number <span className="text-mist-gray text-xs">(optional)</span>
                        </Label>
                        <Combobox
                            options={[
                                { value: "__none__", label: "— No lot selected —" },
                                ...lots.map((lot) => ({
                                    value: lot.id,
                                    label: `${lot.is_occupied ? "🟡" : "🟢"} Lot ${lot.lot_number}`,
                                })),
                            ]}
                            value={selectedLotId || "__none__"}
                            onValueChange={(val) => setSelectedLotId(val === "__none__" ? "" : val)}
                            placeholder={lotsLoading ? "Loading lots..." : "Search for your lot..."}
                            searchPlaceholder="Type a lot number..."
                            emptyText="No matching lots found."
                            className="border-earth-pebble bg-white"
                        />
                        {selectedLot?.is_occupied && (
                            <p className="text-xs text-mist-gray bg-earth-cloud/50 rounded px-2 py-1">
                                This lot currently has residents. The admin will review your request in context.
                            </p>
                        )}
                    </div>

                    {/* Costa Rica Checkbox */}
                    <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                            <Checkbox
                                id="ra-costa-rica"
                                checked={inCostaRica}
                                onCheckedChange={(checked) => setInCostaRica(checked === true)}
                                className="mt-0.5"
                            />
                            <label
                                htmlFor="ra-costa-rica"
                                className="text-sm leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-earth-soil"
                            >
                                I am currently in Costa Rica
                            </label>
                        </div>
                        {!inCostaRica && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="overflow-hidden"
                            >
                                <Alert className="bg-sunrise/10 border-sunrise/30">
                                    <AlertDescription className="text-xs text-earth-soil">
                                        No worries! We&apos;re currently rolling out in Costa Rica first,
                                        but your request will be saved for when we expand to your region.
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        )}
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full bg-forest-canopy hover:bg-forest-deep text-white h-11 text-base font-semibold shadow-md transition-all active:scale-[0.98]"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Submitting...
                            </span>
                        ) : (
                            "Submit Request"
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        href={`/t/${tenant.slug}/login`}
                        className="text-sm text-mist-gray hover:text-earth-soil hover:underline transition-colors"
                    >
                        ← Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </ResponsiveCard>
    )
}
