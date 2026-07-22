'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface LocationMapProps {
  pickupLat?: number;
  pickupLng?: number;
  destLat?: number;
  destLng?: number;
  pickupAddress?: string;
  destAddress?: string;
  interactive?: boolean;
  onLocationSelect?: (pickup: { lat: number; lng: number }, dest: { lat: number; lng: number }) => void;
  height?: string;
}

export default function LocationMap({
  pickupLat = 11.25,
  pickupLng = 75.78,
  destLat = 11.35,
  destLng = 75.88,
  pickupAddress = 'Pickup Location',
  destAddress = 'Destination',
  interactive = false,
  onLocationSelect,
  height = '300px',
}: LocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    // Dynamically import Leaflet client-side
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix missing marker default icons in Next.js build
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const amberIcon = L.divIcon({
        className: 'custom-map-pin amber-pin',
        html: `<div style="background:#ffb238;color:#0f2744;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.3);">P</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const tealIcon = L.divIcon({
        className: 'custom-map-pin teal-pin',
        html: `<div style="background:#1fb6a6;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.3);">D</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([pickupLat, pickupLng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        mapInstanceRef.current = map;

        const pickupMarker = L.marker([pickupLat, pickupLng], {
          icon: amberIcon,
          draggable: interactive,
        })
          .addTo(map)
          .bindPopup(`<b>Pickup</b><br/>${pickupAddress}`);

        const destMarker = L.marker([destLat, destLng], {
          icon: tealIcon,
          draggable: interactive,
        })
          .addTo(map)
          .bindPopup(`<b>Destination</b><br/>${destAddress}`);

        pickupMarkerRef.current = pickupMarker;
        destMarkerRef.current = destMarker;

        const line = L.polyline(
          [
            [pickupLat, pickupLng],
            [destLat, destLng],
          ],
          { color: '#1fb6a6', weight: 4, opacity: 0.8, dashArray: '8, 8' }
        ).addTo(map);
        polylineRef.current = line;

        const bounds = L.latLngBounds([
          [pickupLat, pickupLng],
          [destLat, destLng],
        ]);
        map.fitBounds(bounds, { padding: [40, 40] });

        if (interactive && onLocationSelect) {
          const updateCoords = () => {
            const pPos = pickupMarker.getLatLng();
            const dPos = destMarker.getLatLng();
            line.setLatLngs([
              [pPos.lat, pPos.lng],
              [dPos.lat, dPos.lng],
            ]);
            onLocationSelect(
              { lat: pPos.lat, lng: pPos.lng },
              { lat: dPos.lat, lng: dPos.lng }
            );
          };

          pickupMarker.on('dragend', updateCoords);
          destMarker.on('dragend', updateCoords);

          map.on('click', (e: any) => {
            // Click to update destination
            destMarker.setLatLng(e.latlng);
            updateCoords();
          });
        }
      } else {
        const map = mapInstanceRef.current;
        if (pickupMarkerRef.current) {
          pickupMarkerRef.current.setLatLng([pickupLat, pickupLng]);
        }
        if (destMarkerRef.current) {
          destMarkerRef.current.setLatLng([destLat, destLng]);
        }
        if (polylineRef.current) {
          polylineRef.current.setLatLngs([
            [pickupLat, pickupLng],
            [destLat, destLng],
          ]);
        }
        const bounds = L.latLngBounds([
          [pickupLat, pickupLng],
          [destLat, destLng],
        ]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [pickupLat, pickupLng, destLat, destLng, pickupAddress, destAddress, interactive, onLocationSelect]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-line shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: height }} />
    </div>
  );
}
