export interface GeocodingResult {
    id: string
    name: string
    place_name: string
    center: [number, number] // [lng, lat]
    context?: any[]
}

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
    if (!query || !MAPBOX_ACCESS_TOKEN) return []

    try {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
        const params = new URLSearchParams({
            access_token: MAPBOX_ACCESS_TOKEN,
            types: 'poi,address,place,locality,neighborhood',
            limit: '5',
            language: 'en' // Optional: make configurable
        })

        const response = await fetch(`${endpoint}?${params.toString()}`)

        if (!response.ok) {
            throw new Error(`Mapbox API error: ${response.statusText}`)
        }

        const data = await response.json()

        return data.features.map((feature: any) => ({
            id: feature.id,
            name: feature.text,
            place_name: feature.place_name,
            center: feature.center,
            context: feature.context
        }))
    } catch (error) {
        console.error('[Mapbox Geocoding] Error searching places:', error)
        return []
    }
}

export async function reverseGeocode(lng: number, lat: number): Promise<GeocodingResult | null> {
    if (!MAPBOX_ACCESS_TOKEN) return null

    try {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`
        const params = new URLSearchParams({
            access_token: MAPBOX_ACCESS_TOKEN,
            limit: '1',
        })

        const response = await fetch(`${endpoint}?${params.toString()}`)

        if (!response.ok) {
            throw new Error(`Mapbox API error: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.features && data.features.length > 0) {
            const feature = data.features[0]
            return {
                id: feature.id,
                name: feature.text,
                place_name: feature.place_name,
                center: feature.center,
                context: feature.context
            }
        }

        return null
    } catch (error) {
        console.error('[Mapbox Geocoding] Error reverse geocoding:', error)
        return null
    }
}
