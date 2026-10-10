import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import * as mapsgl from '@xweather/mapsgl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@xweather/mapsgl/dist/mapsgl.css';

export type MapPoint = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  kind: 'critical' | 'assistance' | 'unit' | 'responder';
  detail?: string;
};

type Props = {
  points: MapPoint[];
  onSelect?: (id: string) => void;
  height?: number;
};

export default function LiveMap({ points, onSelect, height = 440 }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapMessage, setMapMessage] = useState('Loading map…');
  const [weatherEnabled, setWeatherEnabled] = useState(false);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [122.36, 11.71],
      zoom: 11,
      attributionControl: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      setMapMessage('Map ready · positions are from the selected records');
      const id = import.meta.env.VITE_XWEATHER_CLIENT_ID;
      const secret = import.meta.env.VITE_XWEATHER_CLIENT_SECRET;
      if (id && secret) {
        try {
          const account = new mapsgl.Account(id, secret);
          const controller = new mapsgl.MaplibreMapController(map, { account });
          controller.on('load', () => {
            try {
              controller.addWeatherLayer('radar');
              setWeatherEnabled(true);
              setMapMessage('Map ready · Xweather radar enabled');
            } catch {
              setMapMessage('Base map ready · Xweather radar could not be enabled; check API access and domain restrictions');
            }
          });
        } catch {
          setMapMessage('Base map ready · check Xweather credentials and domain restrictions');
        }
      } else {
        setMapMessage('Base map ready · add Xweather keys in Netlify environment variables to enable weather layers');
      }
    });
    map.on('error', () => setMapMessage('Map tiles may be unavailable; check your connection'));
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const markers: maplibregl.Marker[] = [];
    points.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180)
      .forEach(point => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'geo-marker geo-marker-' + point.kind;
        el.title = point.label;
        el.setAttribute('aria-label', point.label);
        el.innerHTML = point.kind === 'responder' ? 'R' : point.kind === 'unit' ? 'M' : '!';
        el.addEventListener('click', () => onSelect?.(point.id));
        const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(
          '<strong>' + escapeHtml(point.label) + '</strong>' +
          (point.detail ? '<br/><span>' + escapeHtml(point.detail) + '</span>' : '') +
          '<br/><small>' + point.lat.toFixed(5) + ', ' + point.lon.toFixed(5) + '</small>'
        );
        markers.push(new maplibregl.Marker({ element: el }).setLngLat([point.lon, point.lat]).setPopup(popup).addTo(map));
      });
    return () => markers.forEach(marker => marker.remove());
  }, [points, onSelect]);

  return (
    <div className="map-frame">
      <div ref={container} style={{ width: '100%', height }} />
      <div className="map-status"><span className={'status-dot ' + (weatherEnabled ? '' : 'status-amber')} />{mapMessage}</div>
      <div className="xweather-credit"><a href="https://www.xweather.com/" target="_blank" rel="noreferrer" title="Powered by Vaisala Xweather">Powered by Vaisala Xweather</a></div>
    </div>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}
