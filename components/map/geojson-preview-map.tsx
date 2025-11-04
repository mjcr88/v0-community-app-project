import { APIProvider, Map, Polygon, Polyline, AdvancedMarker } from "some-google-maps-library"
import { MapPin } from "some-icon-library"
import type { ParsedGeoJSON } from "some-geojson-library"

export function GeoJSONPreviewMap({
  features,
  center,
  zoom = 15,
}: {
  features: ParsedGeoJSON["features"]
  center: { lat: number; lng: number }
  zoom?: number
}) {
  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="geojson-preview-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
        >
          {features.map((feature, index) => {
            const geometry = feature.geometry

            if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
              const paths =
                geometry.type === "Polygon"
                  ? geometry.coordinates.map((ring) => ring.map(([lng, lat]) => ({ lat, lng })))
                  : geometry.coordinates.flatMap((polygon) =>
                      polygon.map((ring) => ring.map(([lng, lat]) => ({ lat, lng }))),
                    )

              return paths.map((path, pathIndex) => (
                <Polygon
                  key={`${index}-${pathIndex}`}
                  paths={path}
                  strokeColor="#9333ea"
                  strokeOpacity={0.8}
                  strokeWeight={2}
                  fillColor="#9333ea"
                  fillOpacity={0.2}
                  options={{
                    strokePattern: [10, 5], // Dashed line
                  }}
                />
              ))
            }

            if (geometry.type === "LineString" || geometry.type === "MultiLineString") {
              const paths =
                geometry.type === "LineString"
                  ? [geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))]
                  : geometry.coordinates.map((line) => line.map(([lng, lat]) => ({ lat, lng })))

              return paths.map((path, pathIndex) => (
                <Polyline
                  key={`${index}-${pathIndex}`}
                  path={path}
                  strokeColor="#f97316"
                  strokeOpacity={0.8}
                  strokeWeight={3}
                  options={{
                    strokePattern: [10, 5], // Dashed line
                  }}
                />
              ))
            }

            if (geometry.type === "Point") {
              const [lng, lat] = geometry.coordinates
              return (
                <AdvancedMarker key={index} position={{ lat, lng }}>
                  <div className="bg-yellow-500 rounded-full p-2 border-2 border-white shadow-lg">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                </AdvancedMarker>
              )
            }

            return null
          })}
        </Map>
      </APIProvider>
    </div>
  )
}
