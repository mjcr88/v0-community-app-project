"use client"

import { useEffect, useState } from "react"
import type { ParsedGeoJSON } from "@/lib/geojson-parser"

interface GoogleMapEditorClientWrapperProps {
  tenantSlug: string
  tenantId: string
  communityBoundary: any
  lots: any[]
  neighborhoods: any[]
  isPreview: boolean
}

export function GoogleMapEditorClientWrapper({
  tenantSlug,
  tenantId,
  communityBoundary,
  lots,
  neighborhoods,
  isPreview,
}: GoogleMapEditorClientWrapperProps) {
  const [previewData, setPreviewData] = useState<ParsedGeoJSON | null>(null)

  useEffect(() => {
    if (isPreview) {
      const storedData = sessionStorage.getItem("geojson-preview")
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData)
          setPreviewData(parsed)
          console.log("[v0] Preview data loaded from sessionStorage:", parsed.summary)
          // Clear after reading
          sessionStorage.removeItem("geojson-preview")
        } catch (error) {
          console.error("[v0] Failed to parse preview data:", error)
        }
      }
    }
  }, [isPreview])

  return (
    <div>
      {/* GoogleMapEditor component will go here */}
      <p>Preview data: {previewData ? JSON.stringify(previewData.summary) : "None"}</p>
    </div>
  )
}
