import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export type MapPoint = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  kind: 'critical' | 'assistance' | 'unit' | 'responder';
  detail?: string;
};

type Basemap = 'street' | 'satellite' | 'topographic' | 'tactical';
type LayerKey = 'incidents' | 'units' | 'responders';
type Props = {
  points: MapPoint[];
  onSelect?: (id: string) => void;
  height?: number;
};

const KALIBO: [number, number] = [122.36, 11.71];
const BASEMAPS: { id: Basemap; label: string; short: string; description: string }[] = [
  { id: 'street', label: 'Street', short: 'STREET', description: 'Roads and place labels' },
  { id: 'satellite', label: 'Satellite', short: 'SATELLITE', description: 'Aerial imagery' },
  { id: 'topographic', label: 'Topographic', short: 'TOPO', description: 'Terrain and elevation context' },
  { id: 'tactical', label: 'Night ops', short: 'NIGHT OPS', description: 'Dark, high-contrast operations view' },
];

function rasterStyle(type: Basemap): maplibregl.StyleSpecification {
  const satellite = type === 'satellite';
  const topo = type === 'topographic';
  const tiles = satellite
    ? ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']
    : topo
      ? ['https://tile.opentopomap.org/{z}/{x}/{y}.png']
      : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];
  const attribution = satellite
    ? 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    : topo
      ? 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
      : '© OpenStreetMap contributors';
  return {
    version: 8,
    sources: {
      'puvguard-raster': {
        type: 'raster',
        tiles,
        tileSize: 256,
        attribution,
        ...(topo ? { maxzoom: 17 } : {}),
        ...(satellite ? { maxzoom: 19 } : {}),
      },
    },
    layers: [{ id: 'puvguard-raster-layer', type: 'raster', source: 'puvguard-raster' }],
  };
}

function layerForPoint(point: MapPoint): LayerKey {
  if (point.kind === 'unit') return 'units';
  if (point.kind === 'responder') return 'responders';
  return 'incidents';
}

export default function LiveMap({ points, onSelect, height = 440 }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapMessage, setMapMessage] = useState('Starting map service…');
  const [mapReady, setMapReady] = useState(false);
  const [basemap, setBasemap] = useState<Basemap>('street');
  const [visibleLayers, setVisibleLayers] = useState<Record<LayerKey, boolean>>({
    incidents: true,
    units: true,
    responders: true,
  });

  const visiblePoints = useMemo(
    () => points.filter((point) => visibleLayers[layerForPoint(point)]
      && Number.isFinite(point.lat) && Number.isFinite(point.lon)
      && Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180),
    [points, visibleLayers],
  );

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: rasterStyle('street'),
      center: KALIBO,
      zoom: 12,
      minZoom: 3,
      maxZoom: 19,
      attributionControl: true,
      cooperativeGestures: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    map.once('load', () => {
      setMapReady(true);
      setMapMessage('Basemap ready · plotted positions are local prototype records');
    });
    map.on('error', () => {
      setMapMessage('A map tile could not load · try another basemap or check your connection');
    });
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const changeBasemap = useCallback((next: Basemap) => {
    setBasemap(next);
    const map = mapRef.current;
    if (!map) return;
    setMapReady(false);
    setMapMessage('Switching to ' + BASEMAPS.find((item) => item.id === next)?.label + ' basemap…');
    map.setStyle(rasterStyle(next));
    map.once('style.load', () => {
      setMapReady(true);
      setMapMessage(BASEMAPS.find((item) => item.id === next)?.label + ' basemap ready · public map tiles, no API keys');
    });
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !map.isStyleLoaded()) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    visiblePoints.forEach((point) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'geo-marker geo-marker-' + point.kind;
      el.title = point.label;
      el.setAttribute('aria-label', 'Select map marker: ' + point.label);
      el.innerHTML = point.kind === 'responder' ? 'R' : point.kind === 'unit' ? 'V' : '!';
      el.addEventListener('click', () => onSelect?.(point.id));
      const popupContent = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = point.label;
      popupContent.appendChild(title);
      if (point.detail) {
        const detail = document.createElement('div');
        detail.textContent = point.detail;
        popupContent.appendChild(detail);
      }
      const coords = document.createElement('small');
      coords.textContent = point.lat.toFixed(5) + ', ' + point.lon.toFixed(5);
      popupContent.appendChild(coords);
      const popup = new maplibregl.Popup({ offset: 18, closeButton: true, maxWidth: '250px' }).setDOMContent(popupContent);
      markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([point.lon, point.lat]).setPopup(popup).addTo(map));
    });
  }, [visiblePoints, onSelect, mapReady]);

  const focusKalibo = useCallback(() => {
    mapRef.current?.flyTo({ center: KALIBO, zoom: 12.4, duration: 900, essential: true });
  }, []);

  const fitPositions = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (visiblePoints.length === 0) {
      focusKalibo();
      return;
    }
    if (visiblePoints.length === 1) {
      map.flyTo({ center: [visiblePoints[0].lon, visiblePoints[0].lat], zoom: 15, duration: 850, essential: true });
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    visiblePoints.forEach((point) => bounds.extend([point.lon, point.lat]));
    map.fitBounds(bounds, { padding: { top: 86, right: 66, bottom: 56, left: 66 }, maxZoom: 15, duration: 900 });
  }, [visiblePoints, focusKalibo]);

  const toggleLayer = (key: LayerKey) => {
    setVisibleLayers((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  return (
    <div className={'map-frame map-theme-' + basemap}>
      <div className="map-command-bar">
        <div className="map-command-title">
          <span className="map-radar-glyph"><span /></span>
          <div><strong>GEO MONITOR</strong><small>POSITIONAL AWARENESS · KALIBO AREA</small></div>
        </div>
        <div className="map-source-switch" role="group" aria-label="Choose map type">
          {BASEMAPS.map((item) => (
            <button key={item.id} type="button" className={'map-source-option ' + (basemap === item.id ? 'active' : '')}
              onClick={() => changeBasemap(item.id)} aria-pressed={basemap === item.id} title={item.description}>
              <span className={'map-source-icon map-source-' + item.id} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="map-layer-toolbar">
        <div className="map-layer-toggles" role="group" aria-label="Toggle map layers">
          <button type="button" className={visibleLayers.incidents ? 'map-layer-button layer-incident active' : 'map-layer-button layer-incident'}
            onClick={() => toggleLayer('incidents')} aria-pressed={visibleLayers.incidents}><span />Incidents</button>
          <button type="button" className={visibleLayers.units ? 'map-layer-button layer-unit active' : 'map-layer-button layer-unit'}
            onClick={() => toggleLayer('units')} aria-pressed={visibleLayers.units}><span />Vehicles</button>
          <button type="button" className={visibleLayers.responders ? 'map-layer-button layer-responder active' : 'map-layer-button layer-responder'}
            onClick={() => toggleLayer('responders')} aria-pressed={visibleLayers.responders}><span />Responders</button>
        </div>
        <div className="map-view-actions">
          <button type="button" onClick={fitPositions} title="Fit visible markers in the map">Fit positions</button>
          <button type="button" onClick={focusKalibo} title="Return to Kalibo monitoring area">Kalibo</button>
        </div>
      </div>
      <div className="map-count-strip">
        <span><i className="map-count-dot incidents" />{visiblePoints.filter((point) => layerForPoint(point) === 'incidents').length} incidents / alerts</span>
        <span><i className="map-count-dot vehicles" />{visiblePoints.filter((point) => layerForPoint(point) === 'units').length} vehicles</span>
        <span><i className="map-count-dot responders" />{visiblePoints.filter((point) => layerForPoint(point) === 'responders').length} responders</span>
        <small>Markers represent saved coordinates, not live GPS.</small>
      </div>
      <div ref={container} className="map-canvas" style={{ width: '100%', height }} />
      <div className="map-status">
        <span className={'map-service-dot ' + (mapReady ? 'ready' : 'wait')} />
        <span className="map-status-text">{mapMessage}</span>
        <span className="map-status-mode">NO API KEY REQUIRED</span>
      </div>
    </div>
  );
}
