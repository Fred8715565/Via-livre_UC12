import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { esc } from '../services/geo'
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export default function LMap({ markers, fitKey, focus, onMarker, label, bottomPad = 0 }) {
  const el = useRef(), map = useRef(), layer = useRef()
  useEffect(() => {
    const m = L.map(el.current, { zoomAnimation: !reduce() }).setView(markers[0].pos, 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(m)
    layer.current = L.layerGroup().addTo(m); map.current = m
    return () => m.remove()
  }, []) // eslint-disable-line
  useEffect(() => {
    layer.current.clearLayers()
    markers.forEach(mk => {
      const icon = L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="pin ${mk.kind}"><span>${mk.kind === 'drone' ? '🛸' : ''}</span>${mk.label ? `<b>${esc(mk.label)}</b>` : ''}</div>` })
      const x = L.marker(mk.pos, { icon, title: mk.label || 'Drone-guia', keyboard: !!mk.id }).addTo(layer.current)
      if (onMarker && mk.id) x.on('click', () => onMarker(mk.id))
    })
  }, [markers]) // eslint-disable-line
  useEffect(() => { if (fitKey != null) map.current.fitBounds(markers.filter(m => m.kind !== 'drone').map(m => m.pos), { paddingTopLeft: [40, 40], paddingBottomRight: [40, 40 + bottomPad], maxZoom: 17, animate: !reduce() }) }, [fitKey]) // eslint-disable-line
  useEffect(() => { if (focus) map.current.setView(focus, 17, { animate: !reduce() }) }, [focus])
  return <div ref={el} className="map" role="region" aria-label={label} />
}
