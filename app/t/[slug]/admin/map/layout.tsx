import type { ReactNode } from "react"
import "leaflet/dist/leaflet.css"

export default function MapLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
