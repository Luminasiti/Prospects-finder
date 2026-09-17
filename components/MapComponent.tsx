'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Business, SearchBounds } from '@/lib/types';

interface MapComponentProps {
  businesses: Business[];
  selectedBusinessId: string | null;
  onSelectBusiness: (business: Business) => void;
  bounds: SearchBounds;
  onBoundsChange: (bounds: SearchBounds) => void;
}

// Generate custom Neubrutalism SVG icon based on audit grade
function createCustomPin(business: Business, isSelected: boolean): L.DivIcon {
  const audit = business.audit;
  let color = '#38BDF8'; // blue default
  let label = '?';
  let textColor = '#000000';

  if (!business.website_url) {
    color = '#64748b'; // gray / no website
    label = '✕';
    textColor = '#ffffff';
  } else if (audit && audit.score !== null && audit.score !== undefined) {
    if (audit.score >= 75) {
      color = '#00F59B'; // neon green
      label = `${audit.score}`;
      textColor = '#000000';
    } else if (audit.score >= 50) {
      color = '#FFE600'; // electric yellow
      label = `${audit.score}`;
      textColor = '#000000';
    } else {
      color = '#FB7185'; // bright coral red
      label = `${audit.score}`;
      textColor = '#000000';
    }
  }

  const selectedRing = isSelected
    ? `<div class="absolute -inset-2 rounded-full border-3 border-white animate-ping opacity-90 pointer-events-none"></div>`
    : '';

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer transition-transform hover:scale-115" style="width: 38px; height: 44px;">
      ${selectedRing}
      <div class="w-8 h-8 rounded-xl border-2 border-black flex items-center justify-center font-black text-xs shadow-[2.5px_2.5px_0px_0px_#000]" style="background-color: ${color}; color: ${textColor};">
        ${label}
      </div>
      <div class="w-2.5 h-2.5 rotate-45 -mt-1.5 border-r-2 border-b-2 border-black" style="background-color: ${color};"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-map-marker',
    html,
    iconSize: [38, 44],
    iconAnchor: [19, 44],
    popupAnchor: [0, -44],
  });
}

export const MapComponent: React.FC<MapComponentProps> = ({
  businesses,
  selectedBusinessId,
  onSelectBusiness,
  bounds,
  onBoundsChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);

  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  const onSelectBusinessRef = useRef(onSelectBusiness);
  onSelectBusinessRef.current = onSelectBusiness;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = bounds.center?.lat || 40.7128;
    const initialLng = bounds.center?.lng || -74.006;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    const drawingLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    drawingLayerRef.current = drawingLayer;
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      const currentBounds = boundsRef.current;
      const { lat, lng } = e.latlng;

      if (currentBounds.type === 'radius') {
        onBoundsChangeRef.current({
          ...currentBounds,
          center: { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) },
        });
      } else if (currentBounds.type === 'polygon') {
        const prevPoly = currentBounds.polygon || [];
        onBoundsChangeRef.current({
          ...currentBounds,
          polygon: [...prevPoly, { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }],
        });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Drawing Shapes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const drawingLayer = drawingLayerRef.current;
    if (!map || !drawingLayer) return;

    drawingLayer.clearLayers();

    if (bounds.type === 'radius' && bounds.center) {
      const circle = L.circle([bounds.center.lat, bounds.center.lng], {
        radius: bounds.radius || 3000,
        color: '#000000',
        weight: 3,
        fillColor: '#FFE600',
        fillOpacity: 0.2,
        dashArray: '8, 8',
      });
      drawingLayer.addLayer(circle);

      const centerMarker = L.circleMarker([bounds.center.lat, bounds.center.lng], {
        radius: 7,
        color: '#000000',
        fillColor: '#FFE600',
        fillOpacity: 1,
        weight: 3,
      });
      drawingLayer.addLayer(centerMarker);
    } else if (bounds.type === 'polygon' && bounds.polygon && bounds.polygon.length > 0) {
      const latLngs = bounds.polygon.map(p => [p.lat, p.lng] as [number, number]);

      if (latLngs.length === 1) {
        const pt = L.circleMarker(latLngs[0], {
          radius: 7,
          color: '#000000',
          fillColor: '#38BDF8',
          fillOpacity: 1,
          weight: 3,
        });
        drawingLayer.addLayer(pt);
      } else if (latLngs.length === 2) {
        const polyline = L.polyline(latLngs, {
          color: '#000000',
          weight: 3,
          dashArray: '6, 6',
        });
        drawingLayer.addLayer(polyline);
      } else {
        const polygon = L.polygon(latLngs, {
          color: '#000000',
          weight: 3,
          fillColor: '#38BDF8',
          fillOpacity: 0.2,
        });
        drawingLayer.addLayer(polygon);
      }

      latLngs.forEach((coord) => {
        const vertex = L.circleMarker(coord, {
          radius: 6,
          color: '#000000',
          fillColor: '#FFE600',
          fillOpacity: 1,
          weight: 2.5,
        });
        drawingLayer.addLayer(vertex);
      });
    }
  }, [bounds]);

  // Update Business Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    businesses.forEach((b) => {
      const isSelected = b.id === selectedBusinessId;
      const icon = createCustomPin(b, isSelected);

      const marker = L.marker([b.latitude, b.longitude], { icon });

      const scoreHtml = b.audit?.score !== null && b.audit?.score !== undefined
        ? `<div class="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black border border-black shadow-[1.5px_1.5px_0px_0px_#000] ${
            b.audit.score >= 75
              ? 'bg-[#00F59B] text-black'
              : b.audit.score >= 50
              ? 'bg-[#FFE600] text-black'
              : 'bg-[#FB7185] text-black'
          }">Score: ${b.audit.score}/100</div>`
        : !b.website_url
        ? `<div class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black bg-slate-700 text-white border border-black">No Website</div>`
        : `<div class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black bg-[#38BDF8] text-black border border-black">Pending Audit</div>`;

      const popupContent = `
        <div class="p-2 min-w-[210px] text-white font-sans">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <h4 class="font-black text-sm text-white leading-tight">${b.name}</h4>
          </div>
          <div class="mb-2">${scoreHtml}</div>
          <p class="text-xs font-bold text-slate-300 mb-1">📍 ${b.address}</p>
          <p class="text-xs font-bold text-slate-200 mb-2">📞 ${b.phone}</p>
          ${
            b.website_url
              ? `<a href="${b.website_url}" target="_blank" rel="noreferrer" class="text-xs font-bold text-[#38BDF8] hover:underline block truncate mb-3">🌐 ${b.website_url}</a>`
              : `<p class="text-xs text-slate-400 italic mb-3">No website listed</p>`
          }
          <button id="view-lead-${b.id}" class="w-full bg-[#FFE600] hover:bg-[#FACC15] text-black text-xs font-black py-2 px-3 rounded-xl border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000] transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer">
            VIEW AUDIT & PITCH
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 290 });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-lead-${b.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectBusinessRef.current(b);
          };
        }
      });

      marker.on('click', () => {
        onSelectBusinessRef.current(b);
      });

      markersLayer.addLayer(marker);
    });
  }, [businesses, selectedBusinessId]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-white border-2 border-black p-3.5 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-xs flex flex-col gap-2 max-w-[270px]">
        <span className="font-black text-black tracking-wide text-[11px] uppercase">
          PIN LEGEND
        </span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-black text-black">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#00F59B] border border-black shadow-[1px_1px_0px_0px_#000]"></span>
            <span>Healthy (≥75)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#FFE600] border border-black shadow-[1px_1px_0px_0px_#000]"></span>
            <span>Mediocre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#FB7185] border border-black shadow-[1px_1px_0px_0px_#000]"></span>
            <span>Redesign (&lt;50)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-600 border border-black shadow-[1px_1px_0px_0px_#000]"></span>
            <span>No Web</span>
          </div>
        </div>
      </div>
    </div>
  );
};
