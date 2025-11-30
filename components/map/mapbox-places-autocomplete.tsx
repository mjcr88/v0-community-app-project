"use client"

import * as React from "react"
import { MapPin, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { searchPlaces, type GeocodingResult } from "@/lib/mapbox-geocoding"

interface MapboxPlacesAutocompleteProps {
    value?: string
    onSelect: (place: { name: string; address: string; lat: number; lng: number }) => void
    placeholder?: string
    className?: string
}

export function MapboxPlacesAutocomplete({
    value,
    onSelect,
    placeholder = "Search for a location...",
    className,
}: MapboxPlacesAutocompleteProps) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState(value || "")
    const [results, setResults] = React.useState<GeocodingResult[]>([])
    const [loading, setLoading] = React.useState(false)

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                setLoading(true)
                const places = await searchPlaces(query)
                setResults(places)
                setLoading(false)
            } else {
                setResults([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (place: GeocodingResult) => {
        setQuery(place.place_name)
        setOpen(false)
        onSelect({
            name: place.name,
            address: place.place_name,
            lat: place.center[1],
            lng: place.center[0],
        })
    }

    return (
        <div className={cn("relative", className)}>
            <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setOpen(true)
                            }}
                            placeholder={placeholder}
                            className="pl-9"
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Command shouldFilter={false}>
                        <CommandList>
                            {loading && (
                                <CommandItem disabled className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </CommandItem>
                            )}
                            {!loading && results.length === 0 && query.length > 2 && (
                                <CommandEmpty>No locations found.</CommandEmpty>
                            )}
                            <CommandGroup>
                                {results.map((place) => (
                                    <CommandItem
                                        key={place.id}
                                        value={place.id}
                                        onSelect={() => handleSelect(place)}
                                        className="flex items-start gap-2 py-3"
                                    >
                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{place.name}</span>
                                            <span className="text-xs text-muted-foreground">{place.place_name}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
