"use client";

import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import * as d3geo from "d3-geo";
import type { TrackingResult } from "@/lib/tracking/data";

// World topojson (small) - we'll filter to South Korea (KOR)
const WORLD_TOPOJSON = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Rough coordinate resolver for common Korean locations used in seeds
// Fallback to Seoul if unknown
const cityCoords: Record<string, [number, number]> = {
  "서울": [126.9780, 37.5665],
  "성동": [127.0400, 37.5630],
  "강남": [127.0473, 37.5172],
  "마포": [126.9084, 37.5663],
  "부산": [129.0756, 35.1796],
  "해운대": [129.1580, 35.1631],
  "인천": [126.7052, 37.4563],
  "연수": [126.6800, 37.4100],
  "대구": [128.6014, 35.8714],
  "대전": [127.3845, 36.3504],
  "수원": [127.0286, 37.2636],
  "천안": [127.1522, 36.8151],
  "광주": [126.853, 35.1595],
};

function resolveCoords(location: string | undefined | null): [number, number] {
  if (!location) return cityCoords["서울"]; // default Seoul
  const keys = Object.keys(cityCoords);
  const found = keys.find((k) => location.includes(k));
  return found ? cityCoords[found] : cityCoords["서울"];
}

export type TrackingMapProps = {
  history: TrackingResult["history"];
  className?: string;
};

export const TrackingMap: React.FC<TrackingMapProps> = ({ history, className }) => {
  // Project lon/lat to x/y using a Korea-focused mercator
  const projection = useMemo(() => {
    return d3geo.geoMercator()
      .center([127.7669, 35.9078]) // Center of South Korea
      .scale(2200) // tuned for 600x420 viewport; will scale with viewBox
      .translate([300, 210]);
  }, []);

  const points = useMemo(() => {
    return history.map((ev) => {
      const [lon, lat] = resolveCoords(ev.location);
      const p = projection([lon, lat]) as [number, number];
      return { x: p[0], y: p[1], status: ev.status, location: ev.location, time: ev.time };
    });
  }, [history, projection]);

  // Build arrow paths between consecutive points
  const segments = useMemo(() => {
    const segs: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
    return segs;
  }, [points]);

  return (
    <div className={className}>
      <div className="h-[360px] sm:h-[420px]">
        <svg viewBox="0 0 600 420" className="size-full">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
            </marker>
            <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--border)" />
              <stop offset="100%" stopColor="var(--muted)" />
            </linearGradient>
          </defs>

          {/* Map background */}
          <foreignObject x="0" y="0" width="600" height="420">
            <div className="size-full rounded-md border bg-gradient-to-b from-secondary to-background" />
          </foreignObject>

          {/* South Korea outline using react-simple-maps via foreignObject fall-through */}
          <g>
            <foreignObject x="0" y="0" width="600" height="420">
              <div className="size-full">
                <ComposableMap projection="geoMercator" projectionConfig={{ center: [127.7669, 35.9078], scale: 2200 }} width={600} height={420} style={{ width: "100%", height: "100%" }}>
                  <Geographies geography={WORLD_TOPOJSON}>
                    {({ geographies }) => (
                      <>
                        {geographies
                          .filter((geo) => (geo.properties as any).name === "South Korea" || (geo.properties as any).NAME === "South Korea" || (geo.properties as any).ISO_A3 === "KOR")
                          .map((geo) => (
                            <Geography key={geo.rsmKey} geography={geo} style={{
                              default: { fill: "var(--muted)", outline: "none", stroke: "var(--border)", strokeWidth: 1 },
                              hover: { fill: "var(--accent)", outline: "none" },
                              pressed: { fill: "var(--accent)", outline: "none" },
                            }} />
                          ))}
                      </>
                    )}
                  </Geographies>
                </ComposableMap>
              </div>
            </foreignObject>
          </g>

          {/* Flow segments with arrows */}
          <g stroke="oklch(0.6 0 0)" className="text-primary">
            {segments.map((s, i) => (
              <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} strokeWidth={2} markerEnd="url(#arrow)" opacity={0.9} />
            ))}
          </g>

          {/* Markers */}
          <g>
            {points.map((p, i) => {
              const isLast = i === points.length - 1;
              return (
                <g key={i} transform={`translate(${p.x}, ${p.y})`}>
                  <circle r={6} className={isLast ? "fill-primary" : "fill-muted-foreground/60"} stroke="white" strokeWidth={1} />
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default TrackingMap;