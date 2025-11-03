import type { ReactNode } from "react"
import "mapbox-gl/dist/mapbox-gl.css"

export default function MapLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
