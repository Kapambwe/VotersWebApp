// Election Mapping and Visualization with Leaflet
let map = null;
let markers = [];
let polygons = [];
let layerGroups = {};

export function initializeMap(mapElementId, latitude, longitude, zoom) {
    if (map) {
        map.remove();
        map = null;
    }

    map = L.map(mapElementId, {
        center: [latitude || -13.1339, longitude || 27.8493], // Zambia center
        zoom: zoom || 6,
        zoomControl: false
    });

    // Add OpenStreetMap layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Initialize layer groups
    layerGroups['pollingStations'] = L.layerGroup().addTo(map);
    layerGroups['agents'] = L.layerGroup().addTo(map);
    layerGroups['constituencies'] = L.layerGroup().addTo(map);
    layerGroups['results'] = L.layerGroup().addTo(map);

    return true;
}

export function addMarker(latitude, longitude, popupText) {
    if (!map) return false;

    const marker = L.marker([latitude, longitude]).addTo(map);
    
    if (popupText) {
        marker.bindPopup(popupText);
    }
    
    markers.push(marker);
    return true;
}

export function addPollingStationMarker(latitude, longitude, stationName, status, options) {
    if (!map) return false;

    // Color code by status
    let iconColor = '#3388ff'; // Default blue
    if (status === 'Completed') iconColor = '#10b981'; // Green
    else if (status === 'InProgress') iconColor = '#f59e0b'; // Orange
    else if (status === 'Pending') iconColor = '#6b7280'; // Gray
    else if (status === 'Issue') iconColor = '#ef4444'; // Red

    const icon = L.divIcon({
        className: 'polling-station-marker',
        html: `<div style="background-color: ${iconColor}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const marker = L.marker([latitude, longitude], { icon })
        .bindPopup(`
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0;">${stationName}</h4>
                <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: ${iconColor}">${status}</span></p>
                ${options?.data ? `<p style="margin: 4px 0;"><strong>Votes:</strong> ${options.data.votes || 'N/A'}</p>` : ''}
            </div>
        `);

    marker.addTo(layerGroups['pollingStations']);
    markers.push(marker);
    return true;
}

export function addAgentMarker(latitude, longitude, agentName, status) {
    if (!map) return false;

    const iconColor = status === 'Active' ? '#10b981' : '#6b7280';
    
    const icon = L.divIcon({
        className: 'agent-marker',
        html: `<i class="bi bi-person-badge-fill" style="color: ${iconColor}; font-size: 24px;"></i>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
    });

    const marker = L.marker([latitude, longitude], { icon })
        .bindPopup(`
            <div>
                <h4>${agentName}</h4>
                <p><strong>Status:</strong> ${status}</p>
            </div>
        `);

    marker.addTo(layerGroups['agents']);
    markers.push(marker);
    return true;
}

export function addConstituencyBoundary(constituencyId, coordinates, name, options, results) {
    if (!map) return false;

    const latlngs = coordinates.map(coord => [coord[0], coord[1]]);

    const polygon = L.polygon(latlngs, {
        color: options?.color || '#3388ff',
        weight: options?.weight || 2,
        opacity: options?.opacity || 0.8,
        fillOpacity: options?.fillOpacity || 0.3
    });

    let popupContent = `<h4>${name}</h4>`;
    if (results) {
        popupContent += `
            <p><strong>Total Votes:</strong> ${results.totalVotes || 0}</p>
            <p><strong>Winner:</strong> ${results.winner || 'Pending'}</p>
        `;
    }
    polygon.bindPopup(popupContent);

    polygon.addTo(layerGroups['constituencies']);
    polygons.push(polygon);
    return true;
}

export function addCircle(latitude, longitude, radius, options) {
    if (!map) return false;

    const circle = L.circle([latitude, longitude], {
        color: options?.color || '#3388ff',
        fillColor: options?.fillColor || '#3388ff',
        fillOpacity: options?.fillOpacity || 0.3,
        radius: radius
    }).addTo(map);

    polygons.push(circle);
    return true;
}

export function createHeatmap(heatPoints, options) {
    if (!map) return false;
    
    // Note: Requires leaflet-heat plugin
    console.log('Heatmap visualization', heatPoints.length, 'points');
    
    // Simple circle representation if heatmap plugin not available
    heatPoints.forEach(point => {
        const intensity = point[2] || 0.5;
        const color = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#f59e0b' : '#10b981';
        
        L.circle([point[0], point[1]], {
            color: color,
            fillColor: color,
            fillOpacity: 0.5,
            radius: 5000
        }).addTo(layerGroups['results']);
    });
    
    return true;
}

export function showLayerGroup(groupName) {
    if (layerGroups[groupName] && !map.hasLayer(layerGroups[groupName])) {
        map.addLayer(layerGroups[groupName]);
    }
    return true;
}

export function hideLayerGroup(groupName) {
    if (layerGroups[groupName] && map.hasLayer(layerGroups[groupName])) {
        map.removeLayer(layerGroups[groupName]);
    }
    return true;
}

export function toggleLayer(layerName) {
    if (layerGroups[layerName]) {
        if (map.hasLayer(layerGroups[layerName])) {
            hideLayerGroup(layerName);
        } else {
            showLayerGroup(layerName);
        }
    }
    return true;
}

export function addScaleControl(position) {
    if (!map) return false;
    
    L.control.scale({
        position: position || 'bottomleft',
        imperial: false,
        metric: true
    }).addTo(map);
    
    return true;
}

export function addZoomControl(position) {
    if (!map) return false;
    
    L.control.zoom({
        position: position || 'topleft'
    }).addTo(map);
    
    return true;
}

export function addLegend(legendData, position) {
    if (!map) return false;
    
    const legend = L.control({ position: position || 'bottomright' });
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.background = 'white';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        div.innerHTML = '<h4 style="margin: 0 0 8px 0;">Legend</h4>';
        
        for (const [label, color] of Object.entries(legendData)) {
            div.innerHTML += `
                <div style="margin: 4px 0;">
                    <span style="display: inline-block; width: 20px; height: 20px; background: ${color}; margin-right: 8px; border-radius: 3px;"></span>
                    <span>${label}</span>
                </div>
            `;
        }
        
        return div;
    };
    
    legend.addTo(map);
    return true;
}

export function clearMarkers() {
    markers.forEach(marker => marker.remove());
    markers = [];
}

export function clearPolygons() {
    polygons.forEach(polygon => polygon.remove());
    polygons = [];
}

export function clearAll() {
    clearMarkers();
    clearPolygons();
    
    // Clear layer groups
    Object.values(layerGroups).forEach(group => {
        group.clearLayers();
    });
}

export function setView(latitude, longitude, zoom) {
    if (!map) return false;
    map.setView([latitude, longitude], zoom);
    return true;
}

export function fitBounds(coordinates) {
    if (!map) return false;
    const latlngs = coordinates.map(coord => [coord[0], coord[1]]);
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds);
    return true;
}

export function invalidateSize() {
    if (map) {
        map.invalidateSize();
    }
    return true;
}

export function setupMapClick(dotNetReference) {
    if (!map) return false;
    
    map.on('click', function(e) {
        dotNetReference.invokeMethodAsync('OnMapClickEvent', e.latlng.lat, e.latlng.lng);
    });
    
    return true;
}

// Drawing tools for voter grouping
let drawnItems = null;
let drawControl = null;
let currentDrawing = null;

export function initializeDrawingTools(dotNetReference) {
    if (!map) return false;

    // Initialize FeatureGroup to store drawn items
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Event handlers for drawing
    map.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;
        const type = event.layerType;
        
        drawnItems.addLayer(layer);
        
        // Get the drawn shape data
        let shapeData = null;
        if (type === 'polygon' || type === 'rectangle') {
            const latlngs = layer.getLatLngs()[0];
            shapeData = {
                type: type,
                coordinates: latlngs.map(ll => ({ lat: ll.lat, lng: ll.lng }))
            };
        } else if (type === 'circle') {
            shapeData = {
                type: type,
                center: { lat: layer.getLatLng().lat, lng: layer.getLatLng().lng },
                radius: layer.getRadius()
            };
        }
        
        if (shapeData && dotNetReference) {
            dotNetReference.invokeMethodAsync('OnShapeDrawn', JSON.stringify(shapeData));
        }
    });

    map.on(L.Draw.Event.EDITED, function (event) {
        const layers = event.layers;
        layers.eachLayer(function (layer) {
            // Handle edited shapes
            console.log('Shape edited');
        });
    });

    map.on(L.Draw.Event.DELETED, function (event) {
        const layers = event.layers;
        if (dotNetReference) {
            dotNetReference.invokeMethodAsync('OnShapeDeleted');
        }
    });

    return true;
}

export function enableDrawing(shapeType) {
    if (!map) return false;

    // Remove existing draw control if any
    if (drawControl) {
        map.removeControl(drawControl);
    }

    // Create new draw control with specific shape type enabled
    const drawOptions = {
        position: 'topleft',
        draw: {
            polyline: false,
            polygon: shapeType === 'polygon',
            circle: shapeType === 'circle',
            rectangle: shapeType === 'rectangle',
            marker: false,
            circlemarker: false
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    };

    drawControl = new L.Control.Draw(drawOptions);
    map.addControl(drawControl);

    return true;
}

export function disableDrawing() {
    if (drawControl) {
        map.removeControl(drawControl);
        drawControl = null;
    }
    return true;
}

export function clearDrawings() {
    if (drawnItems) {
        drawnItems.clearLayers();
    }
    return true;
}

export function addVoterMarkers(voters) {
    if (!map) return false;

    voters.forEach(voter => {
        const icon = L.divIcon({
            className: 'voter-marker',
            html: `<div style="background-color: #3b82f6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5]
        });

        const marker = L.marker([voter.latitude, voter.longitude], { icon })
            .bindPopup(`
                <div style="min-width: 180px;">
                    <h5 style="margin: 0 0 8px 0;">${voter.name}</h5>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>NRC:</strong> ${voter.nrc || 'N/A'}</p>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>Area:</strong> ${voter.area || 'N/A'}</p>
                </div>
            `);

        marker.addTo(map);
        markers.push(marker);
    });

    return true;
}

export function highlightVotersInArea(coordinates) {
    if (!map || !coordinates || coordinates.length === 0) return false;

    const polygon = L.polygon(coordinates, {
        color: '#10b981',
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.2
    }).addTo(map);

    polygons.push(polygon);
    
    // Fit map to show the highlighted area
    map.fitBounds(polygon.getBounds());
    
    return true;
}

export function getVotersInShape(shapeData, voterLocations) {
    if (!map || !shapeData || !voterLocations) return [];

    const votersInShape = [];
    
    if (shapeData.type === 'polygon' || shapeData.type === 'rectangle') {
        const polygon = L.polygon(shapeData.coordinates);
        
        voterLocations.forEach(voter => {
            const point = L.latLng(voter.latitude, voter.longitude);
            if (polygon.getBounds().contains(point)) {
                // More precise check using polygon
                const isInside = isPointInPolygon(point, shapeData.coordinates);
                if (isInside) {
                    votersInShape.push(voter);
                }
            }
        });
    } else if (shapeData.type === 'circle') {
        const center = L.latLng(shapeData.center.lat, shapeData.center.lng);
        
        voterLocations.forEach(voter => {
            const point = L.latLng(voter.latitude, voter.longitude);
            const distance = center.distanceTo(point);
            if (distance <= shapeData.radius) {
                votersInShape.push(voter);
            }
        });
    }

    return votersInShape;
}

function isPointInPolygon(point, polygon) {
    let inside = false;
    const x = point.lat, y = point.lng;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}
