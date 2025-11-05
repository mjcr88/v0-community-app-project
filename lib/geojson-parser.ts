export type GeoJSONGeometryType =
  | "Point"
  | "LineString"
  | "Polygon"
  | "MultiPoint"
  | "MultiLineString"
  | "MultiPolygon"
  | "GeometryCollection"

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

    // Check if all geometries are LineStrings (potential boundary segments)
    const allLineStrings = data.geometries.every((g: any) => g.type === "LineString")

    // Check if geometries have individual names/properties (separate locations)
    const hasIndividualProperties = data.geometries.some((g: any) => g.properties && g.properties.name)

    // If all are LineStrings and no individual properties, treat as ONE boundary
    if (allLineStrings && !hasIndividualProperties) {
      console.log("[v0] Pre-processing: Detected boundary segments, combining into single Polygon")

      // Combine all LineString coordinates into one Polygon
      const allCoordinates = data.geometries.flatMap((geometry: any) => geometry.coordinates)

      return {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [allCoordinates],
        },
        properties: data.properties || {
          name: "Boundary",
          source: "GeometryCollection",
        },
      }
    }

    // Otherwise, treat as multiple separate locations
    console.log("[v0] Pre-processing: Converting to", data.geometries.length, "separate features")

    // Convert each geometry to a separate Feature
    const features = data.geometries.map((geometry: any, index: number) => ({
      type: "Feature",
      geometry: geometry,
      properties: geometry.properties ||
        data.properties || {
          name: `Location ${index + 1}`,
          source: "GeometryCollection",
        },
    }))

    console.log("[v0] Pre-processing: Created", features.length, "features from GeometryCollection")

    // Return a FeatureCollection
    return {
      type: "FeatureCollection",
      features: features,
    }
  }

  return data
}

export function parseGeoJSON(data: any): ParsedGeoJSON {
  const preprocessedData = preprocessGeometryCollection(data)

  // Normalize to FeatureCollection
  let features: GeoJSONFeature[]
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
    features = preprocessedData.features.map((feature: any) => {
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
    transformed,
    originalSystem,
  }
}
