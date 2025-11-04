"use client"

import { APIProvider, Map } from "@vis.gl/react-google-maps"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import type { ParsedGeoJSON } from "@/lib/geojson-parser"

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
    <div className="h-[500px] w-full rounded-lg overflow-hidden border">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
        >
          {features.map((feature, index) => {
            const geometry = feature.geometry

            if (geometry.type === "Polygon") {
              const paths = geometry.coordinates.map((ring) => ring.map(([lng, lat]) => ({ lat, lng })))

              return (
                <Polygon
                  key={`polygon-${index}`}
                  paths={paths[0]}
                  strokeColor="#9333ea"
                  strokeOpacity={0.8}
                  strokeWeight={2}
                  fillColor="#9333ea"
                  fillOpacity={0.2}
                />
              )
            }

            if (geometry.type === "MultiPolygon") {
              return geometry.coordinates.map((polygon, polyIndex) => {
                const paths = polygon.map((ring) => ring.map(([lng, lat]) => ({ lat, lng })))
                return (
                  <Polygon
                    key={`multipolygon-${index}-${polyIndex}`}
                    paths={paths[0]}
                    strokeColor="#9333ea"
                    strokeOpacity={0.8}
                    strokeWeight={2}
                    fillColor="#9333ea"
                    fillOpacity={0.2}
                  />
                )
              })
            }

            if (geometry.type === "LineString") {
              const path = geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))

              return (
                <Polyline
                  key={`linestring-${index}`}
                  path={path}
                  strokeColor="#f97316"
                  strokeOpacity={0.8}
                  strokeWeight={3}
                />
              )
            }

            if (geometry.type === "MultiLineString") {
              return geometry.coordinates.map((line, lineIndex) => {
                const path = line.map(([lng, lat]) => ({ lat, lng }))
                return (
                  <Polyline
                    key={`multilinestring-${index}-${lineIndex}`}
                    path={path}
                    strokeColor="#f97316"
                    strokeOpacity={0.8}
                    strokeWeight={3}
                  />
                )
              })
            }

            // Point rendering would go here if needed
            return null
          })}
        </Map>
      </APIProvider>
    </div>
  )
}
