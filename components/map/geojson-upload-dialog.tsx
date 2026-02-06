"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Upload, FileJson, AlertCircle, CheckCircle2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { parseGeoJSON, validateGeoJSON, type ParsedGeoJSON, type ValidationError } from "@/lib/geojson-parser"

interface GeoJSONUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantSlug: string
}

export function GeoJSONUploadDialog({ open, onOpenChange, tenantId, tenantSlug }: GeoJSONUploadDialogProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedGeoJSON | null>(null)
  const [error, setError] = useState<ValidationError | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [transformationInfo, setTransformationInfo] = useState<string | null>(null)
  const [defaultColor, setDefaultColor] = useState("#86B25C") // Default to Green (Lot)
  const [useCustomColor, setUseCustomColor] = useState(false)


  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    setParsedData(null)
    setTransformationInfo(null)

    try {
      const text = await selectedFile.text()
      const data = JSON.parse(text)

      const validationResult = validateGeoJSON(data)

      if (validationResult.error) {
        setError(validationResult.error)
        return
      }

      const parsed = parseGeoJSON(data)
      setParsedData(parsed)

      if (parsed.transformed) {
        setTransformationInfo(
          `Coordinates automatically transformed from ${parsed.originalSystem || "projected coordinate system"} to WGS84 (lat/lng)`,
        )
      }

      if (validationResult.warnings.length > 0 && !parsed.transformed) {
        setError({
          message: validationResult.warnings[0].message,
          details: validationResult.warnings[0].details,
        })
      }
    } catch (err) {
      setError({
        message: "Failed to parse file",
        details: err instanceof Error ? err.message : "Unknown error occurred",
      })
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith(".json") || droppedFile.name.endsWith(".geojson"))) {
      handleFileSelect(droppedFile)
    } else {
      setError({
        message: "Invalid file type",
        details: "Please upload a .json or .geojson file",
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleClose = () => {
    setFile(null)
    setParsedData(null)
    setError(null)
    setTransformationInfo(null)
    onOpenChange(false)
  }

  const handlePreview = () => {
    if (!parsedData) return

    // Inject default color ONLY if selected
    const dataWithColor = {
      ...parsedData,
      features: parsedData.features.map(f => ({
        ...f,
        properties: {
          ...f.properties,
          ...(useCustomColor ? { color: defaultColor } : {}),
          // Note: path_length and elevation_gain were already calculated by the parser
        }
      }))
    }

    sessionStorage.setItem("geojson-preview", JSON.stringify(dataWithColor))
    router.push(`/t/${tenantSlug}/admin/map/locations/create?preview=true`)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload GeoJSON File</DialogTitle>
          <DialogDescription>
            Upload a GeoJSON file to bulk-create locations. Projected coordinates will be automatically converted to
            WGS84.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border"
              }`}
          >
            <input
              type="file"
              id="geojson-upload"
              accept=".json,.geojson"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <label htmlFor="geojson-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                {file ? (
                  <>
                    <FileJson className="h-12 w-12 text-primary" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="font-medium">Drop your GeoJSON file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-2">Supports .json and .geojson files (max 10MB)</p>
                  </>
                )}
              </div>
            </label>
          </div>

          {error && !parsedData && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>{error.message}</p>
                  {error.details && <p className="text-sm">{error.details}</p>}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {transformationInfo && parsedData && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Coordinates Transformed</AlertTitle>
              <AlertDescription>{transformationInfo}</AlertDescription>
            </Alert>
          )}

          {parsedData && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <div>
                  <p className="font-medium">GeoJSON file validated successfully</p>
                  <div className="text-sm mt-2 space-y-1">
                    <p>Total features: {parsedData.summary.totalFeatures}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(parsedData.summary.byType).map(([type, count]) => (
                        <span key={type} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Alert>

              <div className="flex items-center gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="use-custom-color"
                      checked={useCustomColor}
                      onCheckedChange={setUseCustomColor}
                    />
                    <Label htmlFor="use-custom-color" className="text-sm font-medium leading-none cursor-pointer">
                      Override Map Color
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 pl-12">
                    If disabled, the system default color (e.g. Green for Lots) will be used.
                  </p>
                </div>
                {useCustomColor && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div
                      className="w-10 h-10 rounded border shadow-sm"
                      style={{ backgroundColor: defaultColor }}
                    />
                    <input
                      type="color"
                      id="feature-color"
                      value={defaultColor}
                      onChange={(e) => setDefaultColor(e.target.value)}
                      className="h-10 w-16 p-1 cursor-pointer bg-background border rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={!parsedData} onClick={handlePreview}>
            Preview on Map
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
