import type { ReactNode } from "react"
import "maplibre-gl/dist/maplibre-gl.css"

export default function MapLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
