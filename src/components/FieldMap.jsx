import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as turf from '@turf/helpers';
import area from '@turf/area';
import center from '@turf/center';

// Fix Leaflet Default Icon Issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks for drawing
const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
};

// Component to fly to location
const FlyToLocation = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
        map.flyTo(coords, 15, { duration: 2 });
    }
  }, [coords, map]);
  return null;
};

const FieldMap = ({ initialCoordinates, onSave, saving }) => {
  // Default: Ahmednagar
  const defaultCenter = [19.0952, 74.7496]; 
  
  const [points, setPoints] = useState([]);
  const [polygonPath, setPolygonPath] = useState([]);
  const [acreage, setAcreage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  
  // Load initial coordinates
  useEffect(() => {
    if (initialCoordinates && Array.isArray(initialCoordinates) && initialCoordinates.length > 0) {
        // Assuming stored format is [{lat, lng}, ...] or [[lat, lng], ...]
        // Normalizing to Leaflet's preferred [lat, lng] array
        const loadedPoints = initialCoordinates.map(p => {
            if (Array.isArray(p)) return { lat: p[0], lng: p[1] };
            return p;
        });
        setPoints(loadedPoints);

        // Auto-focus on the saved field
        try {
            const polyCoords = loadedPoints.map(p => [p.lng, p.lat]);
            polyCoords.push([loadedPoints[0].lng, loadedPoints[0].lat]); // Close ring
            const poly = turf.polygon([polyCoords]);
            const centerPt = center(poly).geometry.coordinates; // [lng, lat]
            setSearchResult([centerPt[1], centerPt[0]]); // Fly to [lat, lng]
        } catch (e) {
            console.error("Error auto-focusing map:", e);
        }
    }
  }, [initialCoordinates]);

  // Update polygon path when points change
  useEffect(() => {
    if (points.length > 0) {
        setPolygonPath(points);
        calculateArea(points);
    } else {
        setPolygonPath([]);
        setAcreage(0);
    }
  }, [points]);

  const handleMapClick = (latlng) => {
    const newPoints = [...points, latlng];
    setPoints(newPoints);
  };

  const calculateArea = (pts) => {
    if (pts.length < 3) {
        setAcreage(0);
        return;
    }
    
    // Close the polygon for calculation (first point == last point)
    const coordinates = pts.map(p => [p.lng, p.lat]); // Turf expects [lng, lat]
    coordinates.push([pts[0].lng, pts[0].lat]); // Close ring

    const polygon = turf.polygon([coordinates]);
    const areaSqMeters = area(polygon);
    const areaAcres = areaSqMeters * 0.000247105; // Convert m2 to acres
    
    setAcreage(areaAcres.toFixed(2));
  };

  const handleUndo = () => {
    setPoints(points.slice(0, -1));
  };

  const handleClear = () => {
    setPoints([]);
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Ahmednagar, Maharashtra')}`);
        const data = await response.json();
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            setSearchResult([parseFloat(lat), parseFloat(lon)]);
        } else {
            alert('Location not found. Try adding "Ahmednagar" to your search.');
        }
    } catch (e) {
        console.error("Search failed", e);
        alert('Search failed. Please check internet connection.');
    }
  };

  const handleSaveMap = () => {
      // Calculate center for reverse geocoding
      let centerPoint = null;
      if (points.length > 0) {
        const poly = turf.polygon([[...points.map(p => [p.lng, p.lat]), [points[0].lng, points[0].lat]]]);
        centerPoint = center(poly).geometry.coordinates; // [lng, lat]
      }
      
      // Pass full data back to parent
      onSave({
          coordinates: points,
          acreage: acreage,
          center: centerPoint ? [centerPoint[1], centerPoint[0]] : null // Return as [lat, lng]
      });
  };

  return (
    <div className="field-map-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      
      {/* Search & Controls Bar */}
      <div className="map-controls">
        <div className="search-box" style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <input 
                type="text" 
                placeholder="Search Village (e.g., Rahuri)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', flex: 1 }}
            />
            <button onClick={handleSearch} className="btn-secondary">Search</button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="map-stats" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '1rem', borderRadius: '12px' }}>
          <div>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Calculated Area:</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2ecc71' }}>
                {acreage} <span style={{ fontSize: '1rem' }}>Acres</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <button onClick={handleUndo} className="btn-secondary" disabled={points.length === 0}>Undo Point</button>
             <button onClick={handleClear} className="btn-secondary" style={{ color: '#e74c3c' }} disabled={points.length === 0}>Clear Map</button>
          </div>
      </div>

      {/* Map */}
      <div style={{ height: '500px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd', position: 'relative' }}>
          <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            
            {/* Layers Control - Satellite vs Street */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer 
                 attribution='Labels'
                 url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                 opacity={0.7}
            />

            <MapEvents onMapClick={handleMapClick} />
            <FlyToLocation coords={searchResult} />

            {/* Drawn Polygon */}
            {points.length > 0 && (
                <>
                    <Polygon positions={polygonPath} color="#2ecc71" />
                    {points.map((pt, idx) => (
                        <Marker key={idx} position={pt} />
                    ))}
                </>
            )}

          </MapContainer>
          
          {/* Instructions Overlay */}
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(255,255,255,0.9)', padding: '0.5rem', borderRadius: '8px', zIndex: 1000, fontSize: '0.8rem' }}>
              ℹ️ Click the map to drop points for your field boundary.
          </div>
      </div>

      {/* Save Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button 
            onClick={handleSaveMap} 
            className="btn-primary" 
            disabled={saving || points.length < 3}
            style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}
          >
              {saving ? 'Saving...' : 'Save Field Boundary'}
          </button>
      </div>
      
    </div>
  );
};

export default FieldMap;
