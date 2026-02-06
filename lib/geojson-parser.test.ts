import { describe, it, expect } from 'vitest';
import { parseGeoJSON } from './geojson-parser';

// Mock GeoJSON data
const MULTI_SEGMENT_LINESTRING = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "name": "Path A" },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-122.4, 37.8, 10],
                    [-122.5, 37.9, 20]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": { "name": "Path B" },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-122.4, 37.8, 10],
                    [-122.3, 37.7, 5]
                ]
            }
        }
    ]
};

describe('parseGeoJSON', () => {
    it('should preserve Z-coordinates in LineStrings', async () => {
        const result = await parseGeoJSON(MULTI_SEGMENT_LINESTRING);
        // Expect coordinates to keep the 3rd element
        const pathA = result.features.find(f => f.properties?.name === "Path A");
        if (!pathA || pathA.geometry.type !== 'LineString') throw new Error("Feature A not found or invalid");

        // Cast to explicit LineString coordinates [x, y, z][]
        const coords = pathA.geometry.coordinates as number[][];
        expect(coords[0].length).toBe(3);
        expect(coords[0][2]).toBe(10);
    });

    it('should NOT merge separate LineStrings into a Polygon', async () => {
        const result = await parseGeoJSON(MULTI_SEGMENT_LINESTRING);
        expect(result.features.length).toBe(2);
        expect(result.features[0].geometry.type).toBe('LineString');
        expect(result.features[1].geometry.type).toBe('LineString');
    });

    it('should handle FeatureCollection input', async () => {
        const result = await parseGeoJSON(MULTI_SEGMENT_LINESTRING);
        // ParsedGeoJSON structure is internal, doesn't return 'type': 'FeatureCollection'
        expect(result.features).toBeDefined();
        expect(Array.isArray(result.features)).toBe(true);
    });
});

