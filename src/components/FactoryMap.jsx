import { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as turf from '@turf/helpers';
import center from '@turf/center';

// Fix Leaflet Default Icon Issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to adjust view to fit all polygons
const FitBounds = ({ fields }) => {
    const map = useMap();

    useEffect(() => {
        if (fields && fields.length > 0) {
            try {
                const bounds = L.latLngBounds([]);
                fields.forEach(field => {
                    if (field.coordinates && field.coordinates.length > 0) {
                        field.coordinates.forEach(pt => bounds.extend([pt.lat, pt.lng]));
                    }
                });

                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (e) {
                console.error("Error fitting bounds:", e);
            }
        }
    }, [fields, map]);

    return null;
};

const FactoryMap = ({ fields }) => {
    // Default: Ahmednagar
    const defaultCenter = [19.0952, 74.7496];

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
            <MapContainer center={defaultCenter} zoom={10} style={{ height: '100%', width: '100%' }}>

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                <TileLayer
                    attribution='Labels'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                    opacity={0.7}
                />

                <FitBounds fields={fields} />

                {fields.map((field) => (
                    field.coordinates && field.coordinates.length > 2 && (
                        <Polygon
                            key={field.id}
                            positions={field.coordinates}
                            color={field.color || "#2ecc71"} // Allow dynamic coloring
                            fillOpacity={0.4}
                        >
                            <Popup>
                                <div style={{ padding: '0.2rem' }}>
                                    <strong>{field.farmerName}</strong><br />
                                    <span style={{ fontSize: '0.9em', color: '#666' }}>{field.name}</span><br />
                                    <span style={{ fontSize: '0.9em', color: '#2ecc71', fontWeight: 'bold' }}>{field.acreage} Acres</span>
                                </div>
                            </Popup>
                        </Polygon>
                    )
                ))}

            </MapContainer>
        </div>
    );
};

export default FactoryMap;
