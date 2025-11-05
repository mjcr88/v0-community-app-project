// Coordinate transformation utilities for converting projected coordinates to WGS84

import proj4 from "proj4"

export interface CoordinateSystemInfo {
  isProjected: boolean
  detectedSystem?: string
  zone?: number
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
    // Detect UTM zone from easting (each zone is ~6 degrees wide)
    // Costa Rica is typically in zones 16N or 17N
    const zone = Math.floor((x - 166000) / 1000000) + 16
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
 */
export function utmToLatLng(easting: number, northing: number, zone: number): [number, number] {
  // Define UTM projection for the detected zone (Northern hemisphere)
  const utmProj = `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`
  const wgs84Proj = "+proj=longlat +datum=WGS84 +no_defs"

  console.log(`[v0] Converting UTM Zone ${zone}N: [${easting}, ${northing}]`)

  // Transform from UTM to WGS84
  const [lng, lat] = proj4(utmProj, wgs84Proj, [easting, northing])

  console.log(`[v0] Converted to WGS84: [${lng}, ${lat}]`)

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
