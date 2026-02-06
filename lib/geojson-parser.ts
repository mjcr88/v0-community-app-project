export type GeoJSONGeometryType =
  | "Point"
  | "LineString"
  | "Polygon"
  | "MultiPoint"
  | "MultiLineString"
  | "MultiPolygon"
  | "MultiPolygon"
  | "GeometryCollection"

export interface PathStats {
  distance: number // meters
  elevationGain: number // meters
}

export interface GeoJSONFeature {
  type: "Feature"
  geometry: {
    type: GeoJSONGeometryType
    coordinates?: number[] | number[][] | number[][][] | number[][][][]
    geometries?: Array<{
      type: Exclude<GeoJSONGeometryType, "GeometryCollection">
      coordinates: number[] | number[][] | number[][][] | number[][][][]
    }>
  }
  properties: Record<string, any>
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection"
  features: GeoJSONFeature[]
}

export interface ParsedGeoJSON {
  features: GeoJSONFeature[]
  summary: {
    totalFeatures: number
    byType: Record<GeoJSONGeometryType, number>
  }
  transformed?: boolean
  originalSystem?: string
  originalFeatures?: GeoJSONFeature[]
}

export interface ValidationError {
  message: string
  details?: string
}

export interface ValidationWarning {
  message: string
  details?: string
}

export interface ValidationResult {
  error: ValidationError | null
  warnings: ValidationWarning[]
}

export function validateGeoJSON(data: any): ValidationResult {
  const warnings: ValidationWarning[] = []

  // Check if it's valid JSON object
  if (!data || typeof data !== "object") {
    return {
      error: { message: "Invalid JSON format", details: "File must contain a valid JSON object" },
      warnings: [],
    }
  }

  if (data.type !== "Feature" && data.type !== "FeatureCollection" && data.type !== "GeometryCollection") {
    return {
      error: {
        message: "Invalid GeoJSON type",
        details: 'GeoJSON must have type "Feature", "FeatureCollection", or "GeometryCollection"',
      },
      warnings: [],
    }
  }

  if (data.type === "GeometryCollection") {
    if (!Array.isArray(data.geometries)) {
      return {
        error: { message: "Invalid GeometryCollection", details: "GeometryCollection must have a geometries array" },
        warnings: [],
      }
    }

    if (data.geometries.length === 0) {
      return {
        error: { message: "Empty GeometryCollection", details: "No geometries found in the GeoJSON file" },
        warnings: [],
      }
    }

    // Validate each geometry
    for (let i = 0; i < data.geometries.length; i++) {
      const geometry = data.geometries[i]

      if (!geometry.type) {
        return {
          error: { message: `Invalid geometry at index ${i}`, details: "Each geometry must have a type" },
          warnings: [],
        }
      }

      const validTypes = ["Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon"]
      if (!validTypes.includes(geometry.type)) {
        return {
          error: {
            message: `Unsupported geometry type at index ${i}`,
            details: `Geometry type "${geometry.type}" is not supported`,
          },
          warnings: [],
        }
      }

      if (!geometry.coordinates) {
        return {
          error: { message: `Missing coordinates at geometry ${i}`, details: "Each geometry must have coordinates" },
          warnings: [],
        }
      }

      // Check coordinate system
      const coordCheck = checkCoordinateSystem(geometry.coordinates)
      if (coordCheck.warning) {
        warnings.push(coordCheck.warning)
      }
      if (!coordCheck.valid) {
        return {
          error: { message: `Invalid coordinates at geometry ${i}`, details: "Coordinates must be valid numbers" },
          warnings: [],
        }
      }
    }

    return { error: null, warnings }
  }

  // If it's a single Feature, validate it
  if (data.type === "Feature") {
    if (!data.geometry || !data.geometry.type) {
      return {
        error: { message: "Invalid feature", details: "Feature must have a geometry with a type" },
        warnings: [],
      }
    }

    const validTypes = ["Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon"]
    if (!validTypes.includes(data.geometry.type)) {
      return {
        error: {
          message: "Unsupported geometry type",
          details: `Geometry type "${data.geometry.type}" is not supported`,
        },
        warnings: [],
      }
    }

    if (!data.geometry.coordinates) {
      return {
        error: { message: "Missing coordinates", details: "Geometry must have coordinates" },
        warnings: [],
      }
    }

    const coordCheck = checkCoordinateSystem(data.geometry.coordinates)
    if (coordCheck.warning) {
      warnings.push(coordCheck.warning)
    }
    if (!coordCheck.valid) {
      return {
        error: { message: "Invalid coordinates", details: "Coordinates must be valid numbers" },
        warnings: [],
      }
    }

    return { error: null, warnings }
  }

  // Validate FeatureCollection
  if (!Array.isArray(data.features)) {
    return {
      error: { message: "Invalid FeatureCollection", details: "FeatureCollection must have a features array" },
      warnings: [],
    }
  }

  if (data.features.length === 0) {
    return {
      error: { message: "Empty FeatureCollection", details: "No features found in the GeoJSON file" },
      warnings: [],
    }
  }

  // Validate each feature
  for (let i = 0; i < data.features.length; i++) {
    const feature = data.features[i]

    if (feature.type !== "Feature") {
      return {
        error: { message: `Invalid feature at index ${i}`, details: 'Each feature must have type "Feature"' },
        warnings: [],
      }
    }

    if (!feature.geometry || !feature.geometry.type) {
      return {
        error: {
          message: `Invalid geometry at feature ${i}`,
          details: "Each feature must have a geometry with a type",
        },
        warnings: [],
      }
    }

    const validTypes = ["Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon"]
    if (!validTypes.includes(feature.geometry.type)) {
      return {
        error: {
          message: `Unsupported geometry type at feature ${i}`,
          details: `Geometry type "${feature.geometry.type}" is not supported`,
        },
        warnings: [],
      }
    }

    if (!feature.geometry.coordinates) {
      return {
        error: { message: `Missing coordinates at feature ${i}`, details: "Each geometry must have coordinates" },
        warnings: [],
      }
    }

    // Check coordinate system
    const coordCheck = checkCoordinateSystem(feature.geometry.coordinates)
    if (coordCheck.warning) {
      warnings.push(coordCheck.warning)
    }
    if (!coordCheck.valid) {
      return {
        error: { message: `Invalid coordinates at feature ${i}`, details: "Coordinates must be valid numbers" },
        warnings: [],
      }
    }
  }

  return { error: null, warnings }
}

// Helper to calculate distance between two WGS84 points (Haversine formula approximation)
function calculateDistance(coord1: number[], coord2: number[]): number {
  const R = 6371e3 // Earth radius in meters
  const lat1 = (coord1[1] * Math.PI) / 180
  const lat2 = (coord2[1] * Math.PI) / 180
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180
  const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export interface PathStats {
  distance: number // meters
  elevationGain: number // meters
  hasZ: boolean
}

// Calculate total length and elevation gain from a coordinate array
function calculatePathStats(coords: any[]): PathStats {
  let distance = 0
  let elevationGain = 0
  let hasZ = false

  // Flatten logic if multiline or ring, but usually paths are array of points
  // Simple LineString: [[x,y,z], [x,y,z]]
  if (!Array.isArray(coords[0])) return { distance: 0, elevationGain: 0, hasZ: false }

  // Handle MultiLineString structure (array of arrays of points) - recursive sum
  if (Array.isArray(coords[0][0])) {
    return coords.reduce((acc, segment) => {
      const segStats = calculatePathStats(segment)
      return {
        distance: acc.distance + segStats.distance,
        elevationGain: acc.elevationGain + segStats.elevationGain,
        hasZ: acc.hasZ || segStats.hasZ
      }
    }, { distance: 0, elevationGain: 0, hasZ: false })
  }

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i]
    const p2 = coords[i + 1]

    // Distance
    distance += calculateDistance(p1, p2)

    // Elevation (Z is index 2)
    // Detailed Logging for Debugging
    if (i === 0) {
      console.log(`[v0-parser] Point 0: [${p1.join(', ')}] (Length: ${p1.length})`)
      console.log(`[v0-parser] Point 1: [${p2.join(', ')}] (Length: ${p2.length})`)
      console.log(`[v0-parser] p1[2] type: ${typeof p1[2]}, value: ${p1[2]}`)
    }

    if (typeof p1[2] === 'number' && typeof p2[2] === 'number') {
      hasZ = true
      const dh = p2[2] - p1[2]
      if (dh > 0) elevationGain += dh
    }
  }

  return {
    distance: Math.round(distance), // Round to meters
    elevationGain: Math.round(elevationGain),
    hasZ
  }
}

function checkCoordinateSystem(coords: any): { valid: boolean; warning?: ValidationWarning } {
  if (Array.isArray(coords)) {
    if (coords.length === 0) return { valid: false }

    // Check if it's a coordinate pair [lng, lat]
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const [lng, lat] = coords

      // Check if coordinates are in a projected system (values too large for lat/lng)
      if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
        return {
          valid: true,
          warning: {
            message: "Projected coordinate system detected",
            details:
              "Coordinates appear to be in a projected coordinate system (e.g., UTM). You may need to convert them to WGS84 (lat/lng) for proper display on the map.",
          },
        }
      }

      // Validate lng/lat ranges for WGS84
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return { valid: false }
      }

      return { valid: true }
    }

    // Recursively validate nested arrays
    let hasWarning = false
    let warning: ValidationWarning | undefined

    for (const c of coords) {
      const result = checkCoordinateSystem(c)
      if (!result.valid) return { valid: false }
      if (result.warning && !hasWarning) {
        hasWarning = true
        warning = result.warning
      }
    }

    return { valid: true, warning }
  }

  return { valid: false }
}

import { transformGeometry } from "./coordinate-transformer"

function preprocessGeometryCollection(data: any): any {
  // Check if it's a GeometryCollection
  if (data.type === "GeometryCollection" && Array.isArray(data.geometries)) {
    console.log("[v0] Pre-processing: GeometryCollection with", data.geometries.length, "geometries detected")

    const originalFeatures = data.geometries.map((geometry: any, index: number) => ({
      type: "Feature",
      geometry: geometry,
      properties: geometry.properties ||
        data.properties || {
        name: `Location ${index + 1}`,
        source: "GeometryCollection",
      },
    }))

    // Check if all geometries are LineStrings (potential boundary segments)
    const allLineStrings = data.geometries.every((g: any) => g.type === "LineString")

    // For non-LineString geometries, OR if we want to respect the original segmentation (Task 83)
    // We strictly return separate features to prevent merging into "Rings"
    console.log("[v0] Pre-processing: Keeping", originalFeatures.length, "separate features")

    return {
      type: "FeatureCollection",
      features: originalFeatures,
      originalFeatures: originalFeatures,
    }
  }

  return data
}

export function parseGeoJSON(data: any): ParsedGeoJSON {
  const preprocessedData = preprocessGeometryCollection(data)

  // Normalize to FeatureCollection
  let features: GeoJSONFeature[]
  let originalFeatures: GeoJSONFeature[] | undefined
  let transformed = false
  let originalSystem: string | undefined

  if (preprocessedData.type === "GeometryCollection") {
    // Transform each geometry in the collection
    const transformedGeometries = preprocessedData.geometries.map((geometry: any) => {
      const result = transformGeometry(geometry)
      if (result.transformed) {
        transformed = true
        originalSystem = result.system
      }
      return result.geometry
    })

    // Create a single feature with GeometryCollection geometry
    features = [
      {
        type: "Feature" as const,
        geometry: {
          type: "GeometryCollection" as const,
          geometries: transformedGeometries,
        },
        properties: {
          name: "Geometry Collection",
          source: "GeometryCollection",
        },
      },
    ]
  } else if (preprocessedData.type === "Feature") {
    const result = transformGeometry(preprocessedData.geometry)
    if (result.transformed) {
      transformed = true
      originalSystem = result.system
    }

    features = [
      {
        ...preprocessedData,
        geometry: result.geometry,
      },
    ]
  } else {
    if (preprocessedData.originalFeatures) {
      originalFeatures = preprocessedData.originalFeatures.map((feature: any) => {
        const result = transformGeometry(feature.geometry)
        if (result.transformed) {
          transformed = true
          originalSystem = result.system
        }
        return {
          ...feature,
          geometry: result.geometry,
        }
      })
    }

    features = preprocessedData.features.flatMap((feature: any) => {
      // Flatten MultiLineString into separate LineStrings
      if (feature.geometry && feature.geometry.type === 'MultiLineString') {
        return feature.geometry.coordinates.map((coords: any[], index: number) => {
          const result = transformGeometry({
            type: 'LineString',
            coordinates: coords
          })
          if (result.transformed) {
            transformed = true
            originalSystem = result.system
          }
          return {
            ...feature,
            properties: {
              ...feature.properties,
              _original_type: 'MultiLineString',
              _segment_index: index
            },
            geometry: result.geometry
          }
        })
      }

      // Normal processing for other types
      const result = transformGeometry(feature.geometry)
      if (result.transformed) {
        transformed = true
        originalSystem = result.system
      }

      return [{
        ...feature,
        geometry: result.geometry
      }]
    })
  }

  // Generate summary
  const byType: Record<string, number> = {}

  features.forEach((feature) => {
    const type = feature.geometry.type
    byType[type] = (byType[type] || 0) + 1

    // CALCULATE STATS
    // If it is a LineString or MultiLineString, calculate path stats
    if (type === 'LineString' || type === 'MultiLineString') {
      const stats = calculatePathStats(feature.geometry.coordinates as any[])

      // Normalize properties (Case-insensitive lookup for common aliases)
      const props = feature.properties || {}
      const keys = Object.keys(props).map(k => ({ original: k, lower: k.toLowerCase() }))

      const findVal = (aliases: string[]) => {
        const match = keys.find(k => aliases.includes(k.lower))
        return match ? props[match.original] : null
      }

      // 1. Difficulty
      const difficulty = props.path_difficulty || findVal(['difficulty', 'grade', 'rating', 'diff'])

      // 2. Surface
      const surface = props.path_surface || findVal(['surface', 'terrain', 'material', 'ground'])

      // 3. Elevation Gain
      const explicitElevation = props.elevation_gain || findVal(['elevation', 'elevationgain', 'ascent', 'total_ascent', 'climb', 'gain'])
      let finalElevation = 0

      if (stats.hasZ) {
        finalElevation = stats.elevationGain
      } else if (explicitElevation !== null) {
        // Parse explicit value if available
        const parsed = parseFloat(explicitElevation)
        if (!isNaN(parsed)) finalElevation = parsed
      }

      feature.properties = {
        ...feature.properties,
        path_length: stats.distance,
        elevation_gain: Math.round(finalElevation),
        path_difficulty: difficulty,
        path_surface: surface
      }
    }
  })

  return {
    features,
    originalFeatures,
    summary: {
      totalFeatures: features.length,
      byType: byType as Record<GeoJSONGeometryType, number>,
    },
    transformed,
    originalSystem,
  }
}
