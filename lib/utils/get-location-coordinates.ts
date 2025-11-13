/**
 * Extracts or calculates coordinates for a location.
 * If the location has a coordinates field, use it.
 * Otherwise, calculate the center point from boundary_coordinates or path_coordinates.
 */
export function getLocationCoordinates(location: {
  coordinates?: { lat: number; lng: number } | null
  boundary_coordinates?: Array<[number, number]> | null
  path_coordinates?: Array<[number, number]> | null
}): { lat: number; lng: number } | null {
  if (location.coordinates) {
    return location.coordinates
  }

  if (location.boundary_coordinates && location.boundary_coordinates.length > 0) {
    const lats = location.boundary_coordinates.map((c) => c[0])
    const lngs = location.boundary_coordinates.map((c) => c[1])
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
    return { lat: centerLat, lng: centerLng }
  }

  if (location.path_coordinates && location.path_coordinates.length > 0) {
    return {
      lat: location.path_coordinates[0][0],
      lng: location.path_coordinates[0][1],
    }
  }

  return null
}
