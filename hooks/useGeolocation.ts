import { useState, useEffect, useCallback, useRef, useMemo } from "react"

interface GeolocationState {
    latitude: number | null
    longitude: number | null
    accuracy: number | null
    heading: number | null
    speed: number | null
    timestamp: number | null
    error: GeolocationPositionError | null
    permissionStatus: PermissionState | "unknown"
}

export function useGeolocation(options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
}) {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        heading: null,
        speed: null,
        timestamp: null,
        error: null,
        permissionStatus: "unknown",
    })

    const watchId = useRef<number | null>(null)
    const [enabled, setEnabled] = useState(false)

    // Memoize options to prevent unnecessary effect re-runs
    const stableOptions = useMemo(() => options, [
        options.enableHighAccuracy,
        options.timeout,
        options.maximumAge
    ])

    // Monitor permission status
    useEffect(() => {
        let mounted = true
        let permissionResult: PermissionStatus | null = null

        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: "geolocation" }).then((result) => {
                if (!mounted) return

                permissionResult = result
                setState((s) => ({ ...s, permissionStatus: result.state }))

                // If already granted, auto-enable
                if (result.state === "granted") {
                    setEnabled(true)
                }

                result.onchange = () => {
                    if (!mounted) return
                    setState((s) => ({ ...s, permissionStatus: result.state }))
                    if (result.state === "granted") {
                        setEnabled(true)
                    }
                }
            }).catch(() => {
                // Firefox or unsupported browsers might fail query
                if (mounted) {
                    setState((s) => ({ ...s, permissionStatus: "unknown" }))
                }
            })
        }

        return () => {
            mounted = false
            if (permissionResult) {
                permissionResult.onchange = null
            }
        }
    }, [])

    const onEvent = useCallback((position: GeolocationPosition) => {
        setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
            error: null,
            permissionStatus: "granted"
        })
    }, [])

    const onError = useCallback((error: GeolocationPositionError) => {
        setState((s) => ({ ...s, error }))
    }, [])

    // Start/Stop watcher based on 'enabled' state
    useEffect(() => {
        if (!enabled || !navigator.geolocation) return

        // Initial fetch to get quick lock
        navigator.geolocation.getCurrentPosition(onEvent, onError, stableOptions)

        // Start watching
        watchId.current = navigator.geolocation.watchPosition(onEvent, onError, stableOptions)

        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current)
                watchId.current = null
            }
        }
    }, [enabled, stableOptions, onEvent, onError])

    const enable = useCallback(() => {
        if (!navigator || !navigator.geolocation) {
            setState((s) => ({
                ...s,
                error: {
                    code: 2, // POSITION_UNAVAILABLE
                    message: "Geolocation not supported",
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2,
                    TIMEOUT: 3
                } as GeolocationPositionError
            }))
            return
        }

        setEnabled(true)
        // Trigger a read to force the prompt if not yet granted
        if (!enabled) {
            navigator.geolocation.getCurrentPosition(onEvent, onError, stableOptions)
        }
    }, [enabled, onEvent, onError, stableOptions])

    return {
        ...state,
        enabled,
        enable
    }
}
