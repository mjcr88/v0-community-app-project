export type GeoJSONGeometryType = "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon"

export interface GeoJSONFeature {
  type: "Feature"
  geometry: {
    type: GeoJSONGeometryType
    coordinates: number[] | number[][] | number[][][] | number[][][][]
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
}

export interface ValidationError {
  message: string
  details?: string
}

export function validateGeoJSON(data: any): ValidationError | null {
  // Check if it's valid JSON object
  if (!data || typeof data !== "object") {
    return { message: "Invalid JSON format", details: "File must contain a valid JSON object" }
  }

  // Check if it's a Feature or FeatureCollection
  if (data.type !== "Feature" && data.type !== "FeatureCollection") {
    return {
      message: "Invalid GeoJSON type",
      details: 'GeoJSON must have type "Feature" or "FeatureCollection"',
    }
  }

  // If it's a single Feature, wrap it in a FeatureCollection
  if (data.type === "Feature") {
    return null
  }

  // Validate FeatureCollection
  if (!Array.isArray(data.features)) {
    return { message: "Invalid FeatureCollection", details: "FeatureCollection must have a features array" }
  }

  if (data.features.length === 0) {
    return { message: "Empty FeatureCollection", details: "No features found in the GeoJSON file" }
  }

  // Validate each feature
  for (let i = 0; i < data.features.length; i++) {
    const feature = data.features[i]

    if (feature.type !== "Feature") {
      return { message: `Invalid feature at index ${i}`, details: 'Each feature must have type "Feature"' }
    }

    if (!feature.geometry || !feature.geometry.type) {
      return { message: `Invalid geometry at feature ${i}`, details: "Each feature must have a geometry with a type" }
    }

    const validTypes = ["Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon"]
    if (!validTypes.includes(feature.geometry.type)) {
      return {
        message: `Unsupported geometry type at feature ${i}`,
        details: `Geometry type "${feature.geometry.type}" is not supported`,
      }
    }

    if (!feature.geometry.coordinates) {
      return { message: `Missing coordinates at feature ${i}`, details: "Each geometry must have coordinates" }
    }

    // Validate coordinates are numbers
    const coords = feature.geometry.coordinates
    if (!validateCoordinates(coords)) {
      return { message: `Invalid coordinates at feature ${i}`, details: "Coordinates must be valid numbers" }
    }
  }

  return null
}

function validateCoordinates(coords: any): boolean {
  if (Array.isArray(coords)) {
    if (coords.length === 0) return false

    // Check if it's a coordinate pair [lng, lat]
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      // Validate lng/lat ranges
      const [lng, lat] = coords
      return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
    }

    // Recursively validate nested arrays
    return coords.every((c) => validateCoordinates(c))
  }

  return false
}

export function parseGeoJSON(data: any): ParsedGeoJSON {
  // Normalize to FeatureCollection
  let features: GeoJSONFeature[]

  if (data.type === "Feature") {
    features = [data]
  } else {
    features = data.features
  }

  // Generate summary
  const byType: Record<string, number> = {}

  features.forEach((feature) => {
    const type = feature.geometry.type
    byType[type] = (byType[type] || 0) + 1
  })

  return {
    features,
    summary: {
      totalFeatures: features.length,
      byType: byType as Record<GeoJSONGeometryType, number>,
    },
  }
}
