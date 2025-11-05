"use client"

import { useEffect, useState } from "react"
import { GoogleMapEditor } from "./google-map-editor"
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
  const [isLoading, setIsLoading] = useState(isPreview)

  useEffect(() => {
    if (isPreview) {
      const storedData = sessionStorage.getItem("geojson-preview")
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData)
          setPreviewData(parsed)
          console.log("[v0] Preview data loaded from sessionStorage:", parsed.summary)
        } catch (error) {
          console.error("[v0] Failed to parse preview data:", error)
        }
      }
      setIsLoading(false)
    }
  }, [isPreview])

  if (isLoading) {
    return <div className="flex items-center justify-center h-[600px]">Loading preview...</div>
  }

  return (
    <GoogleMapEditor
      tenantSlug={tenantSlug}
      tenantId={tenantId}
      lots={lots}
      neighborhoods={neighborhoods}
      mode="edit"
    />
  )
}
