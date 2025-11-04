// Coordinate transformation utilities for converting projected coordinates to WGS84

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
 * Converts UTM coordinates to WGS84 lat/lng
 * Simplified conversion for Central America (Costa Rica region)
 */
export function utmToLatLng(easting: number, northing: number, zone: number): [number, number] {
  // UTM parameters
  const k0 = 0.9996 // scale factor
  const a = 6378137.0 // WGS84 equatorial radius
  const e = 0.081819191 // WGS84 eccentricity
  const e1sq = 0.006739497 // e'^2

  // Remove false easting and northing
  const x = easting - 500000.0
  const y = northing

  // Calculate footpoint latitude
  const M = y / k0
  const mu = M / (a * (1 - Math.pow(e, 2) / 4 - (3 * Math.pow(e, 4)) / 64 - (5 * Math.pow(e, 6)) / 256))

  const phi1 =
    mu +
    ((3 * e1sq) / 2 - (27 * Math.pow(e1sq, 3)) / 32) * Math.sin(2 * mu) +
    ((21 * Math.pow(e1sq, 2)) / 16 - (55 * Math.pow(e1sq, 4)) / 32) * Math.sin(4 * mu) +
    ((151 * Math.pow(e1sq, 3)) / 96) * Math.sin(6 * mu)

  // Calculate latitude and longitude
  const C1 = e1sq * Math.pow(Math.cos(phi1), 2)
  const T1 = Math.pow(Math.tan(phi1), 2)
  const N1 = a / Math.sqrt(1 - Math.pow(e * Math.sin(phi1), 2))
  const R1 = (a * (1 - Math.pow(e, 2))) / Math.pow(1 - Math.pow(e * Math.sin(phi1), 2), 1.5)
  const D = x / (N1 * k0)

  const lat =
    phi1 -
    ((N1 * Math.tan(phi1)) / R1) *
      ((Math.pow(D, 2) / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * Math.pow(C1, 2) - 9 * e1sq) * Math.pow(D, 4)) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * Math.pow(T1, 2) - 252 * e1sq - 3 * Math.pow(C1, 2)) * Math.pow(D, 6)) / 720) /
        (Math.PI / 180))

  const lng =
    ((D -
      ((1 + 2 * T1 + C1) * Math.pow(D, 3)) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * Math.pow(C1, 2) + 8 * e1sq + 24 * Math.pow(T1, 2)) * Math.pow(D, 5)) / 120) /
      Math.cos(phi1)) *
      (180 / Math.PI) +
    (zone - 1) * 6 -
    180 +
    3

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
