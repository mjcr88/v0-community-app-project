"use client"

import { useEffect } from "react"

export function MobileZoomFix() {
    useEffect(() => {
        const handleGestureStart = (e: Event) => {
            // Allow gestures on map elements
            // mapboxgl-map is the class Mapbox adds to its container
            if ((e.target as Element).closest('.mapboxgl-map')) {
                return
            }
            e.preventDefault()
        }

        // gesturestart is non-standard (Safari only) but that's where the issue is
        // @ts-ignore
        document.addEventListener("gesturestart", handleGestureStart)

        return () => {
            // @ts-ignore
            document.removeEventListener("gesturestart", handleGestureStart)
        }
    }, [])

    return null
}
