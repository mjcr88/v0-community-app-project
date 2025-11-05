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

  // Check for UTM (typical range: 166,000 - 834,000 for easting, 0 - 10,000,000 for northing)
  if (x >= 160000 && x <= 840000 && y >= 0 && y <= 10000000) {
    // Will be validated and corrected in utmToLatLng if needed
    const zone = 17
    return {
      isProjected: true,
      detectedSystem: `UTM Zone ${zone}N`,
      zone,
    }
  }

  return { isProjected: true, detectedSystem: "Unknown projected system" }
}

/**
 * Converts UTM coordinates to WGS84 lat/lng using proj4
 * Automatically tries both Zone 16N and 17N to find the correct one for Costa Rica
 */
export function utmToLatLng(easting: number, northing: number, zone: number): [number, number] {
  const utmProj = `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`
  const wgs84Proj = "+proj=longlat +datum=WGS84 +no_defs"

  console.log(`[v0] Converting UTM Zone ${zone}N: [${easting}, ${northing}]`)

  // Transform from UTM to WGS84
  const [lng, lat] = proj4(utmProj, wgs84Proj, [easting, northing])

  console.log(`[v0] Converted to WGS84: [${lng.toFixed(6)}, ${lat.toFixed(6)}]`)

  if (isInCostaRica(lng, lat)) {
    console.log(`[v0] ✓ Coordinates validated in Costa Rica bounds`)
    return [lng, lat]
  }

  console.warn(`[v0] ⚠️ Coordinates outside Costa Rica: [${lng.toFixed(6)}, ${lat.toFixed(6)}]`)
  const alternateZone = zone === 16 ? 17 : 16
  console.log(`[v0] Trying alternate Zone ${alternateZone}N...`)

  const altUtmProj = `+proj=utm +zone=${alternateZone} +datum=WGS84 +units=m +no_defs`
  const [altLng, altLat] = proj4(altUtmProj, wgs84Proj, [easting, northing])

  console.log(`[v0] Alternate conversion: [${altLng.toFixed(6)}, ${altLat.toFixed(6)}]`)

  if (isInCostaRica(altLng, altLat)) {
    console.log(`[v0] ✓ Using Zone ${alternateZone}N - coordinates validated in Costa Rica`)
    return [altLng, altLat]
  }

  console.error(`[v0] ❌ Neither Zone 16N nor 17N produced valid Costa Rica coordinates. Using Zone ${zone}N result.`)
  return [lng, lat]
}

/**
 * Recursively transforms coordinates in a geometry
 */
export function transformCoordinates(coords: any, zone: number): any {
  if (Array.isArray(coords)) {
    // Check if it's a coordinate pair [x, y]
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const info = detectCoordinateSystem(coords)
      if (info.isProjected) {
        return utmToLatLng(coords[0], coords[1], zone)
      }
      return coords
    }

    // Recursively transform nested arrays
    return coords.map((c) => transformCoordinates(c, zone))
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

  // Use detected zone or default to 16 for Costa Rica
  const zone = info.zone || 16

  return {
    geometry: {
      ...geometry,
      coordinates: transformCoordinates(geometry.coordinates, zone),
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
