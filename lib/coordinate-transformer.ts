// Coordinate transformation utilities for converting projected coordinates to WGS84

import proj4 from "proj4"

export interface CoordinateSystemInfo {
  isProjected: boolean
  detectedSystem?: string
  zone?: number
}

const COSTA_RICA_BOUNDS = {
  minLng: -86.0,
  maxLng: -82.0,
  minLat: 8.0,
  maxLat: 11.5,
}

// CRTM05 (EPSG:8908) - Costa Rica's official coordinate system
const CRTM05_PROJ =
  "+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
const WGS84_PROJ = "+proj=longlat +datum=WGS84 +no_defs"

/**
 * Validates if coordinates are within Costa Rica bounds
 */
function isInCostaRica(lng: number, lat: number): boolean {
  return (
    lng >= COSTA_RICA_BOUNDS.minLng &&
    lng <= COSTA_RICA_BOUNDS.maxLng &&
    lat >= COSTA_RICA_BOUNDS.minLat &&
    lat <= COSTA_RICA_BOUNDS.maxLat
  )
}

/**
 * Detects if coordinates are in a projected system and attempts to identify it
 */
export function detectCoordinateSystem(coords: number[]): CoordinateSystemInfo {
  const [x, y] = coords

  // Check if coordinates are in WGS84 range
  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return { isProjected: false }
  }

  if (x >= 160000 && x <= 840000 && y >= 0 && y <= 10000000) {
    return {
      isProjected: true,
      detectedSystem: "CRTM05 (Costa Rica Transverse Mercator)",
    }
  }

  return { isProjected: true, detectedSystem: "Unknown projected system" }
}

/**
 * Converts CRTM05 or UTM coordinates to WGS84 lat/lng
 * First tries CRTM05 (Costa Rica's official system), then falls back to UTM if needed
 */
export function crtmToLatLng(easting: number, northing: number): [number, number] {
  console.log(`[v0] Converting CRTM05: [${easting}, ${northing}]`)

  const [lng, lat] = proj4(CRTM05_PROJ, WGS84_PROJ, [easting, northing])

  console.log(`[v0] Converted to WGS84: [${lng.toFixed(6)}, ${lat.toFixed(6)}]`)

  if (isInCostaRica(lng, lat)) {
    console.log(`[v0] ✓ Coordinates validated in Costa Rica bounds using CRTM05`)
    return [lng, lat]
  }

  console.warn(`[v0] ⚠️ CRTM05 result outside Costa Rica: [${lng.toFixed(6)}, ${lat.toFixed(6)}]`)
  console.log(`[v0] Trying UTM Zone 16N as fallback...`)

  const utm16Proj = "+proj=utm +zone=16 +datum=WGS84 +units=m +no_defs"
  const [lng16, lat16] = proj4(utm16Proj, WGS84_PROJ, [easting, northing])

  console.log(`[v0] UTM Zone 16N result: [${lng16.toFixed(6)}, ${lat16.toFixed(6)}]`)

  if (isInCostaRica(lng16, lat16)) {
    console.log(`[v0] ✓ Using UTM Zone 16N - coordinates validated in Costa Rica`)
    return [lng16, lat16]
  }

  console.log(`[v0] Trying UTM Zone 17N as fallback...`)
  const utm17Proj = "+proj=utm +zone=17 +datum=WGS84 +units=m +no_defs"
  const [lng17, lat17] = proj4(utm17Proj, WGS84_PROJ, [easting, northing])

  console.log(`[v0] UTM Zone 17N result: [${lng17.toFixed(6)}, ${lat17.toFixed(6)}]`)

  if (isInCostaRica(lng17, lat17)) {
    console.log(`[v0] ✓ Using UTM Zone 17N - coordinates validated in Costa Rica`)
    return [lng17, lat17]
  }

  console.error(
    `[v0] ❌ None of the projections (CRTM05, UTM 16N, UTM 17N) produced valid Costa Rica coordinates. Using CRTM05 result.`,
  )
  return [lng, lat]
}

/**
 * Recursively transforms coordinates in a geometry
 */
export function transformCoordinates(coords: any): any {
  if (Array.isArray(coords)) {
    // Check if it's a coordinate pair [x, y]
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const info = detectCoordinateSystem(coords)
      if (info.isProjected) {
        return crtmToLatLng(coords[0], coords[1])
      }
      return coords
    }

    // Recursively transform nested arrays
    return coords.map((c) => transformCoordinates(c))
  }

  return coords
}

/**
 * Transforms a GeoJSON geometry from projected coordinates to WGS84
 */
export function transformGeometry(geometry: any): { geometry: any; transformed: boolean; system?: string } {
  if (!geometry || !geometry.coordinates) {
    return { geometry, transformed: false }
  }

  // Detect coordinate system from first coordinate
  const firstCoord = getFirstCoordinate(geometry.coordinates)
  if (!firstCoord) {
    return { geometry, transformed: false }
  }

  const info = detectCoordinateSystem(firstCoord)
  if (!info.isProjected) {
    return { geometry, transformed: false }
  }

  return {
    geometry: {
      ...geometry,
      coordinates: transformCoordinates(geometry.coordinates),
    },
    transformed: true,
    system: info.detectedSystem,
  }
}

/**
 * Gets the first coordinate pair from nested coordinate arrays
 */
function getFirstCoordinate(coords: any): number[] | null {
  if (Array.isArray(coords)) {
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      return coords
    }
    return getFirstCoordinate(coords[0])
  }
  return null
}
