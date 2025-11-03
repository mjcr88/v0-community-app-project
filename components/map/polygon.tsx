"use client"

import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from "react"
import { GoogleMapsContext } from "@vis.gl/react-google-maps"
import type { Ref } from "react"
import { google } from "googlemaps" // Declare the google variable

type PolygonEventProps = {
  onClick?: (e: google.maps.MapMouseEvent) => void
  onDrag?: (e: google.maps.MapMouseEvent) => void
  onDragStart?: (e: google.maps.MapMouseEvent) => void
  onDragEnd?: (e: google.maps.MapMouseEvent) => void
  onMouseOver?: (e: google.maps.MapMouseEvent) => void
  onMouseOut?: (e: google.maps.MapMouseEvent) => void
}

export type PolygonProps = google.maps.PolygonOptions & PolygonEventProps

export type PolygonRef = Ref<google.maps.Polygon | null>

function usePolygon(props: PolygonProps) {
  const { onClick, onDrag, onDragStart, onDragEnd, onMouseOver, onMouseOut, ...polygonOptions } = props

  const callbacks = useRef<Record<string, ((e: google.maps.MapMouseEvent) => void) | undefined>>({})
  Object.assign(callbacks.current, {
    onClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onMouseOver,
    onMouseOut,
  })

  const polygon = useRef(new google.maps.Polygon()).current

  const polygonOptionsRef = useRef(polygonOptions)
  polygonOptionsRef.current = polygonOptions

  useEffect(() => {
    polygon.setOptions(polygonOptionsRef.current)
  }, [polygon])

  const map = useContext(GoogleMapsContext)?.map

  useEffect(() => {
    if (!map) {
      if (map === undefined) console.error("<Polygon> has to be inside a Map component.")
      return
    }

    polygon.setMap(map)

    return () => {
      polygon.setMap(null)
    }
  }, [map, polygon])

  useEffect(() => {
    if (!polygon) return

    const gme = google.maps.event
    ;[
      ["click", "onClick"],
      ["drag", "onDrag"],
      ["dragstart", "onDragStart"],
      ["dragend", "onDragEnd"],
      ["mouseover", "onMouseOver"],
      ["mouseout", "onMouseOut"],
    ].forEach(([eventName, eventCallback]) => {
      gme.addListener(polygon, eventName, (e: google.maps.MapMouseEvent) => {
        const callback = callbacks.current[eventCallback]
        if (callback) callback(e)
      })
    })

    return () => {
      gme.clearInstanceListeners(polygon)
    }
  }, [polygon])

  return polygon
}

export const Polygon = forwardRef((props: PolygonProps, ref: PolygonRef) => {
  const polygon = usePolygon(props)
  useImperativeHandle(ref, () => polygon, [polygon])
  return null
})

Polygon.displayName = "Polygon"
