// Election Mapping and Visualization with Leaflet
let map = null;
let markers = [];
let polygons = [];
let layerGroups = {};
let markerClusterGroup = null;
let clusteringEnabled = false;
let mapInstances = {};
let activeMapId = null;
let layerControl = null;
let legendControl = null;
let baseTileLayer = null;
let baseTileLayerFallbackTimer = null;
let offlineBackdropLayer = null;
let offlineBackdropLoadPromise = null;
let offlineBackdropGridLayer = null;
let offlineBackdropLabelLayer = null;
let offlineBackdropSourceLayers = [];
let offlineBackdropZoomHandler = null;

const OFFLINE_BACKDROP_SOURCES = [
    'data/boundaries/zm/province.geojson',
    'data/boundaries/zm/district.geojson',
    'data/boundaries/zm/constituency.geojson'
];

const OFFLINE_THEMES = {
    street: {
        water: '#dbeafe',
        land: '#f8fafc',
        halo: '#c7d2fe',
        boundaryColors: ['#475569', '#64748b', '#94a3b8'],
        boundaryFills: ['#edf2f7', '#f1f5f9', '#f8fafc'],
        labelColor: '#0f172a'
    },
    satellite: {
        water: '#dbeafe',
        land: '#f8fafc',
        halo: '#93c5fd',
        boundaryColors: ['#334155', '#475569', '#64748b'],
        boundaryFills: ['#f8fafc', '#eef2ff', '#f8fafc'],
        labelColor: '#0f172a'
    },
    terrain: {
        water: '#dbeafe',
        land: '#f7fbf5',
        halo: '#bbf7d0',
        boundaryColors: ['#365314', '#4d7c0f', '#65a30d'],
        boundaryFills: ['#eff6ff', '#f8fafc', '#f7fee7'],
        labelColor: '#14532d'
    },
    choropleth: {
        water: '#dbeafe',
        land: '#f8fafc',
        halo: '#bae6fd',
        boundaryColors: ['#1d4ed8', '#2563eb', '#3b82f6'],
        boundaryFills: ['#dbeafe', '#eff6ff', '#f8fafc'],
        labelColor: '#0f172a'
    },
    default: {
        water: '#dbeafe',
        land: '#f8fafc',
        halo: '#c7d2fe',
        boundaryColors: ['#475569', '#64748b', '#94a3b8'],
        boundaryFills: ['#edf2f7', '#f1f5f9', '#f8fafc'],
        labelColor: '#0f172a'
    }
};

const BASE_TILE_PROVIDERS = {
    street: [
        {
            name: 'Esri Street',
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            options: {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 19
            }
        },
        {
            name: 'OpenStreetMap',
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            options: {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19,
                subdomains: ['a', 'b', 'c']
            }
        },
        {
            name: 'Carto Light',
            url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            options: {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                maxZoom: 20,
                subdomains: ['a', 'b', 'c', 'd']
            }
        }
    ],
    satellite: [
        {
            name: 'Esri Imagery',
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            options: {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 19
            }
        },
        {
            name: 'Esri Street',
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            options: {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 19
            }
        },
        {
            name: 'OpenStreetMap',
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            options: {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19,
                subdomains: ['a', 'b', 'c']
            }
        }
    ],
    terrain: [
        {
            name: 'OpenTopoMap',
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            options: {
                attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
                maxZoom: 17,
                subdomains: ['a', 'b', 'c']
            }
        },
        {
            name: 'Esri Street',
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            options: {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 19
            }
        },
        {
            name: 'OpenStreetMap',
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            options: {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19,
                subdomains: ['a', 'b', 'c']
            }
        }
    ]
};

/**
 * Returns true when the Leaflet global `L` is available.
 * All exported functions that reference `L` call this guard first so that
 * maps degrade gracefully when Leaflet is loaded from CDN and the network
 * is unavailable.
 */
function _leafletAvailable() {
    return typeof L !== 'undefined';
}

function _ensureMapContextCollections(context) {
    if (!context) {
        return context;
    }

    if (!context.markers) {
        context.markers = [];
    }

    if (!context.polygons) {
        context.polygons = [];
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'markerClusterGroup')) {
        context.markerClusterGroup = null;
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'clusteringEnabled')) {
        context.clusteringEnabled = false;
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'layerControl')) {
        context.layerControl = null;
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'legendControl')) {
        context.legendControl = null;
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'baseTileLayer')) {
        context.baseTileLayer = null;
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'baseTileLayerFallbackTimer')) {
        context.baseTileLayerFallbackTimer = null;
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'offlineBackdropLayer')) {
        context.offlineBackdropLayer = null;
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'offlineBackdropLoadPromise')) {
        context.offlineBackdropLoadPromise = null;
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'offlineBackdropGridLayer')) {
        context.offlineBackdropGridLayer = null;
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'offlineBackdropLabelLayer')) {
        context.offlineBackdropLabelLayer = null;
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'offlineBackdropSourceLayers')) {
        context.offlineBackdropSourceLayers = [];
    }

    if (!Object.prototype.hasOwnProperty.call(context, 'offlineBackdropZoomHandler')) {
        context.offlineBackdropZoomHandler = null;
    }

    return context;
}

function _getMapContext() {
    if (activeMapId && mapInstances[activeMapId]) {
        return _ensureMapContextCollections(mapInstances[activeMapId]);
    }

    if (map) {
        return _ensureMapContextCollections({ map, layerGroups, markers, polygons, markerClusterGroup, clusteringEnabled, layerControl, legendControl, baseTileLayer, baseTileLayerFallbackTimer, offlineBackdropLayer, offlineBackdropLoadPromise, offlineBackdropGridLayer, offlineBackdropLabelLayer, offlineBackdropSourceLayers, offlineBackdropZoomHandler });
    }

    return null;
}

function _setActiveMap(mapElementId) {
    activeMapId = mapElementId;
    const context = mapInstances[mapElementId];
    if (context) {
        map = context.map;
        layerGroups = context.layerGroups;
    }
    return context;
}

async function _waitForMapContainer(mapElementId, retries = 20, delayMs = 25) {
    for (let attempt = 0; attempt < retries; attempt++) {
        const container = document.getElementById(mapElementId);
        if (container?.isConnected) {
            return container;
        }

        await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    return document.getElementById(mapElementId);
}

export async function initializeMap(mapElementId, latitude, longitude, zoom) {
    if (!_leafletAvailable()) {
        console.warn('Leaflet library not loaded – map initialization skipped.');
        return false;
    }

    const container = await _waitForMapContainer(mapElementId);
    if (!container) {
        console.warn(`Leaflet map container not found for ${mapElementId}.`);
        return false;
    }

    const existing = mapInstances[mapElementId];
    if (existing?.map) {
        try {
            const container = existing.map.getContainer?.();
            if (container?.parentNode) {
                existing.map.remove();
            }
        } catch (error) {
            console.warn(`Leaflet map cleanup skipped for ${mapElementId}:`, error);
        }
    }

    map = L.map(container, {
        center: [latitude || -13.1339, longitude || 27.8493], // Zambia center
        zoom: zoom || 6,
        zoomControl: false
    });

    mapInstances[mapElementId] = {
        map,
        mapType: 'street',
        layerGroups: {},
        markers: [],
        polygons: [],
        markerClusterGroup: null,
        clusteringEnabled: false,
        layerControl: null,
        legendControl: null,
        baseTileLayer: null,
        baseTileLayerFallbackTimer: null,
        offlineBackdropLayer: null,
        offlineBackdropLoadPromise: null,
        offlineBackdropGridLayer: null,
        offlineBackdropLabelLayer: null,
        offlineBackdropSourceLayers: [],
        offlineBackdropZoomHandler: null
    };
    _setActiveMap(mapElementId);
    _styleLeafletControlChrome(mapInstances[mapElementId]);

    layerGroups = mapInstances[mapElementId].layerGroups;
    layerGroups['pollingStations'] = L.layerGroup().addTo(map);
    layerGroups['agents'] = L.layerGroup().addTo(map);
    layerGroups['constituencies'] = L.layerGroup().addTo(map);
    layerGroups['results'] = L.layerGroup().addTo(map);

    map.whenReady(() => {
        if (mapInstances[mapElementId]?.map === map) {
            setMapType('street');
            requestAnimationFrame(() => {
                if (mapInstances[mapElementId]?.map === map) {
                    map.invalidateSize();
                }
            });
        }
    });

    return true;
}

function _styleLeafletControlChrome(context) {
    const container = context?.map?.getContainer?.();
    if (!container) {
        return;
    }

    container.classList.add('leaflet-google-lite');
}

function _setOfflineBackdropActive(context, isActive) {
    const container = context?.map?.getContainer?.();
    if (!container) {
        return;
    }

    container.classList.toggle('offline-backdrop-active', !!isActive);
}

function _resolveOfflineTheme(mapType) {
    const key = (mapType || 'default').toLowerCase();
    if (OFFLINE_THEMES[key]) {
        return OFFLINE_THEMES[key];
    }

    return OFFLINE_THEMES.default;
}

function _removeOfflineBackdropDecorations(context) {
    if (!context?.map) {
        return;
    }

    if (context.offlineBackdropGridLayer) {
        try {
            context.map.removeLayer(context.offlineBackdropGridLayer);
        } catch (error) {
            console.warn('Leaflet offline grid removal skipped:', error);
        }
        context.offlineBackdropGridLayer = null;
    }

    if (context.offlineBackdropLabelLayer) {
        try {
            context.map.removeLayer(context.offlineBackdropLabelLayer);
        } catch (error) {
            console.warn('Leaflet offline label removal skipped:', error);
        }
        context.offlineBackdropLabelLayer = null;
    }

    context.offlineBackdropSourceLayers = [];

    if (context.offlineBackdropZoomHandler) {
        try {
            context.map.off('zoomend', context.offlineBackdropZoomHandler);
        } catch (error) {
            console.warn('Leaflet offline zoom handler removal skipped:', error);
        }
        context.offlineBackdropZoomHandler = null;
    }

    _setOfflineBackdropActive(context, false);
}

function _createOfflineBackdropDecorations(context, geoJson) {
    if (!_leafletAvailable() || !context?.map || !geoJson?.features?.length) {
        return false;
    }

    const geoJsonIndex = context.offlineBackdropSourceLayers.findIndex(entry => entry?.url === geoJson?.url);
    const sourceRecord = geoJsonIndex >= 0 ? context.offlineBackdropSourceLayers[geoJsonIndex] : { url: geoJson?.url || null, geoJson };
    if (geoJsonIndex < 0) {
        context.offlineBackdropSourceLayers.push(sourceRecord);
    } else {
        context.offlineBackdropSourceLayers[geoJsonIndex] = sourceRecord;
    }

    const refreshDecorations = () => {
        _renderOfflineBackdropDecorations(context);
    };

    if (!context.offlineBackdropZoomHandler) {
        context.offlineBackdropZoomHandler = refreshDecorations;
        context.map.on('zoomend', context.offlineBackdropZoomHandler);
    }

    _renderOfflineBackdropDecorations(context);
    return true;
}

function _renderOfflineBackdropDecorations(context) {
    if (!_leafletAvailable() || !context?.map) {
        return false;
    }

    _removeLayerOnly(context, 'offlineBackdropGridLayer');
    _removeLayerOnly(context, 'offlineBackdropLabelLayer');

    const zoom = context.map.getZoom?.() ?? 0;
    const theme = _resolveOfflineTheme(context.mapType);
    const sources = (context.offlineBackdropSourceLayers || []).filter(entry => entry?.geoJson?.features?.length);
    if (sources.length === 0) {
        return false;
    }

    const combinedBounds = L.latLngBounds([]);
    sources.forEach(source => {
        const layer = L.geoJSON(source.geoJson);
        const bounds = layer.getBounds?.();
        if (bounds?.isValid?.()) {
            combinedBounds.extend(bounds);
        }
    });

    if (!combinedBounds.isValid?.()) {
        return false;
    }

    const paddedBounds = combinedBounds.pad(0.1);
    const south = Math.floor(paddedBounds.getSouth());
    const north = Math.ceil(paddedBounds.getNorth());
    const west = Math.floor(paddedBounds.getWest());
    const east = Math.ceil(paddedBounds.getEast());

    const gridLayer = L.layerGroup();
    const gridStyle = {
        color: theme.boundaryColors[2],
        weight: 0.7,
        opacity: zoom >= 8 ? 0.2 : 0.14,
        dashArray: '6 8',
        interactive: false
    };

    for (let lat = south; lat <= north; lat += 1) {
        gridLayer.addLayer(L.polyline([[lat, west], [lat, east]], gridStyle));
    }

    for (let lng = west; lng <= east; lng += 1) {
        gridLayer.addLayer(L.polyline([[south, lng], [north, lng]], gridStyle));
    }

    const labelLayer = L.layerGroup();
    const occupiedBounds = [];
    const labelBudget = zoom >= 9 ? 18 : zoom >= 7 ? 12 : 6;
    const labelSources = zoom >= 9
        ? sources
        : zoom >= 7
            ? sources.filter(source => source.geoJson.features.some(feature => (feature?.properties?.levelKey || '').toLowerCase() !== 'constituency'))
            : sources.filter(source => source.geoJson.features.some(feature => (feature?.properties?.levelKey || '').toLowerCase() === 'province'));

    labelSources.forEach(source => {
        source.geoJson.features.slice(0, labelBudget).forEach((feature, index) => {
            const levelKey = (feature?.properties?.levelKey || '').toLowerCase();
            if ((zoom < 9 && levelKey === 'constituency') || (zoom < 7 && levelKey !== 'province')) {
                return;
            }

            const name = feature?.properties?.name || feature?.properties?.NAME || feature?.properties?.regionName || `Region ${index + 1}`;
            const geometryLayer = L.geoJSON(feature);
            const center = geometryLayer.getBounds?.().getCenter?.();
            if (!center) {
                return;
            }

            const labelSize = Math.max(48, Math.min(132, 22 + (name.length * 6)));
            const labelPoint = context.map.latLngToContainerPoint(center);
            const labelBounds = L.bounds(
                [labelPoint.x - labelSize / 2, labelPoint.y - 10],
                [labelPoint.x + labelSize / 2, labelPoint.y + 14]
            );
            const collides = occupiedBounds.some(bounds => bounds.intersects(labelBounds));
            if (collides) {
                return;
            }
            occupiedBounds.push(labelBounds);

            const label = L.marker(center, {
                interactive: false,
                keyboard: false,
                opacity: 1,
                icon: L.divIcon({
                    className: 'offline-map-label-marker',
                    html: `<span class="offline-map-label" style="color:${theme.labelColor};">${name}</span>`,
                    iconSize: [0, 0],
                    iconAnchor: [0, 0]
                })
            });

            labelLayer.addLayer(label);
        });
    });

    gridLayer.addTo(context.map);
    labelLayer.addTo(context.map);
    context.offlineBackdropGridLayer = gridLayer;
    context.offlineBackdropLabelLayer = labelLayer;
    return true;
}

function _removeLayerOnly(context, propertyName) {
    const layer = context?.[propertyName];
    if (!layer || !context?.map) {
        return;
    }

    try {
        context.map.removeLayer(layer);
    } catch (error) {
        console.warn(`Leaflet ${propertyName} removal skipped:`, error);
    }

    context[propertyName] = null;
}

function _getLayerGroup(layerName) {
    const context = _getMapContext();
    if (!context?.map) {
        return null;
    }

    if (!context.layerGroups[layerName]) {
        context.layerGroups[layerName] = L.layerGroup().addTo(context.map);
    }

    return context.layerGroups[layerName];
}

export function addMarker(latitude, longitude, popupText) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

    const marker = L.marker([latitude, longitude]).addTo(context.map);
    
    if (popupText) {
        marker.bindPopup(popupText);
    }
    
    context.markers.push(marker);
    return true;
}

export function addPollingStationMarker(latitude, longitude, stationName, status, options) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

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

    marker.addTo(context.layerGroups['pollingStations']);
    context.markers.push(marker);
    return true;
}

export function addAgentMarker(latitude, longitude, agentName, status) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

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

    marker.addTo(context.layerGroups['agents']);
    context.markers.push(marker);
    return true;
}

export function addConstituencyBoundary(constituencyId, coordinates, name, options, results) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

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

    polygon.addTo(context.layerGroups['constituencies']);
    context.polygons.push(polygon);
    return true;
}

export function addGeoJsonLayer(layerName, geoJson, styleOptions, hoverOptions) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map || !geoJson) return false;

    const group = _getLayerGroup(layerName);
    if (!group) return false;
    group.clearLayers();

    const layer = L.geoJSON(geoJson, {
        style: function(feature) {
            const properties = feature?.properties || {};
            const fillColor = properties.fillColor || styleOptions?.fillColor || '#2563eb';
            const color = properties.color || styleOptions?.color || '#1d4ed8';

            return {
                color,
                weight: properties.weight || styleOptions?.weight || 1.5,
                opacity: properties.opacity || styleOptions?.opacity || 0.9,
                fillColor,
                fillOpacity: properties.fillOpacity ?? styleOptions?.fillOpacity ?? 0.35
            };
        },
        onEachFeature: function(feature, featureLayer) {
            const properties = feature?.properties || {};
            const tooltipHtml = properties.tooltipHtml || properties.name || '';
            const popupHtml = properties.popupHtml || tooltipHtml;

            if (tooltipHtml) {
                featureLayer.bindTooltip(tooltipHtml, {
                    sticky: true,
                    direction: hoverOptions?.direction || 'top',
                    className: hoverOptions?.className || 'region-results-tooltip'
                });
            }

            if (popupHtml) {
                featureLayer.bindPopup(popupHtml);
            }

            featureLayer.on({
                mouseover: function(e) {
                    const target = e.target;
                    target.setStyle({
                        weight: (styleOptions?.hoverWeight || 3),
                        color: '#333',
                        dashArray: '',
                        fillOpacity: (styleOptions?.hoverFillOpacity ?? 0.68)
                    });
                    target.bringToFront();
                },
                mouseout: function(e) {
                    layer.resetStyle(e.target);
                }
            });
        }
    });

    layer.addTo(group);
    context.polygons.push(layer);
    return true;
}

export function setLayerVisibility(layerName, isVisible) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map || !context.layerGroups[layerName]) return false;

    if (isVisible && !context.map.hasLayer(context.layerGroups[layerName])) {
        context.map.addLayer(context.layerGroups[layerName]);
    } else if (!isVisible && context.map.hasLayer(context.layerGroups[layerName])) {
        context.map.removeLayer(context.layerGroups[layerName]);
    }

    return true;
}

export function clearLayer(layerName) {
    const context = _getMapContext();
    if (!context?.layerGroups[layerName]) return true;
    context.layerGroups[layerName].clearLayers();
    return true;
}

export function fitLayerBounds(layerName) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map || !context.layerGroups[layerName]) return false;
    const layers = context.layerGroups[layerName].getLayers();
    if (!layers.length) return false;

    const bounds = L.featureGroup(layers).getBounds();
    if (bounds.isValid()) {
        context.map.fitBounds(bounds, { padding: [24, 24] });
        return true;
    }

    return false;
}

export function bindRegionClick(layerName, dotNetReference) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map || !context.layerGroups[layerName] || !dotNetReference) return false;

    context.layerGroups[layerName].eachLayer(groupLayer => {
        if (groupLayer.eachLayer) {
            groupLayer.eachLayer(featureLayer => {
                featureLayer.on('click', function(e) {
                    const props = e.target?.feature?.properties || {};
                    dotNetReference.invokeMethodAsync('OnRegionClicked', props.levelKey || '', props.regionKey || '', props.name || '');
                });
            });
        }
    });

    return true;
}

export function addLayerControl(baseLayers, overlayLayers) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

    if (context.layerControl) {
        context.map.removeControl(context.layerControl);
        context.layerControl = null;
    }

    const overlays = {};
    Object.keys(overlayLayers || {}).forEach(key => {
        if (context.layerGroups[key]) {
            overlays[overlayLayers[key] || key] = context.layerGroups[key];
        }
    });

    context.layerControl = L.control.layers(null, overlays, { collapsed: false }).addTo(context.map);
    return true;
}

export function addCircle(latitude, longitude, radius, options) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

    const circle = L.circle([latitude, longitude], {
        color: options?.color || '#3388ff',
        fillColor: options?.fillColor || '#3388ff',
        fillOpacity: options?.fillOpacity || 0.3,
        radius: radius
    }).addTo(context.map);

    context.polygons.push(circle);
    return true;
}

export function createHeatmap(heatPoints, options) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;
    
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
        }).addTo(context.layerGroups['results']);
    });
    
    return true;
}

export function showLayerGroup(groupName) {
    const context = _getMapContext();
    if (context?.layerGroups[groupName] && !context.map.hasLayer(context.layerGroups[groupName])) {
        context.map.addLayer(context.layerGroups[groupName]);
    }
    return true;
}

export function hideLayerGroup(groupName) {
    const context = _getMapContext();
    if (context?.layerGroups[groupName] && context.map.hasLayer(context.layerGroups[groupName])) {
        context.map.removeLayer(context.layerGroups[groupName]);
    }
    return true;
}

export function toggleLayer(layerName) {
    const context = _getMapContext();
    if (context?.layerGroups[layerName]) {
        if (context.map.hasLayer(context.layerGroups[layerName])) {
            hideLayerGroup(layerName);
        } else {
            showLayerGroup(layerName);
        }
    }
    return true;
}

export function addScaleControl(position) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;
    
    L.control.scale({
        position: position || 'topleft',
        imperial: false,
        metric: true
    }).addTo(context.map);
    
    return true;
}

export function addZoomControl(position) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;
    
    L.control.zoom({
        position: position || 'topleft'
    }).addTo(context.map);
    
    return true;
}

export function addLegend(legendData, position) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

    if (context.legendControl) {
        context.map.removeControl(context.legendControl);
        context.legendControl = null;
    }

    const title = legendData?.title || 'Legend';
    const items = Array.isArray(legendData?.items)
        ? legendData.items
        : (legendData?.items && typeof legendData.items === 'object')
            ? Object.entries(legendData.items).map(([label, color]) => ({ label, color }))
            : Object.entries(legendData || {})
                .filter(([key]) => key !== 'title' && key !== 'items')
                .map(([label, color]) => ({ label, color }));
    const gradient = Array.isArray(legendData?.gradient) ? legendData.gradient : null;
    
    const legend = L.control({ position: position || 'topleft' });
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend map-legend');
        const useGradient = !!gradient?.length;
        div.innerHTML = useGradient
            ? `
            <div class="map-legend-header">
                <h4 class="map-legend-title">${title}</h4>
            </div>
            <div class="map-legend-gradient-wrap">
                <div class="map-legend-gradient">
                    ${gradient.map(item => `<span style="background:${item?.color || '#64748b'}"></span>`).join('')}
                </div>
                <div class="map-legend-gradient-labels">
                    ${gradient.map(item => `<span>${item?.label || ''}</span>`).join('')}
                </div>
            </div>
        `
            : `
            <div class="map-legend-header">
                <h4 class="map-legend-title">${title}</h4>
            </div>
            <div class="map-legend-items"></div>
        `;

        if (!useGradient) {
            const itemsContainer = div.querySelector('.map-legend-items');
            for (const item of items) {
                const label = item?.label || '';
                const color = item?.color || '#64748b';
                itemsContainer.innerHTML += `
                    <div class="map-legend-item">
                        <span class="map-legend-swatch" style="background: ${color};"></span>
                        <span class="map-legend-label">${label}</span>
                    </div>
                `;
            }
        }
        
        return div;
    };
    
    legend.addTo(context.map);
    context.legendControl = legend;
    return true;
}

export function setMapType(mapType) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

    const container = context.map.getContainer?.();
    if (!container || !container.parentNode) {
        return false;
    }

    if (context.baseTileLayer) {
        try {
            context.map.removeLayer(context.baseTileLayer);
        } catch (error) {
            console.warn('Leaflet base tile removal skipped:', error);
        }
        context.baseTileLayer = null;
    }

    if (context.baseTileLayerFallbackTimer) {
        clearTimeout(context.baseTileLayerFallbackTimer);
        context.baseTileLayerFallbackTimer = null;
    }

    if (context.offlineBackdropLayer) {
        try {
            context.map.removeLayer(context.offlineBackdropLayer);
        } catch (error) {
            console.warn('Leaflet offline backdrop removal skipped:', error);
        }
        context.offlineBackdropLayer = null;
    }

    _setOfflineBackdropActive(context, false);

    const type = (mapType || 'street').toLowerCase();
    const providers = BASE_TILE_PROVIDERS[type] || BASE_TILE_PROVIDERS.street;
    context.mapType = type;

    const activateProvider = (providerIndex) => {
        const provider = providers[providerIndex];
        if (!provider) {
            console.warn(`No working Leaflet tile provider available for map type "${type}".`);
            context.baseTileLayer = null;
            return false;
        }

        let layer = null;
        try {
            layer = L.tileLayer(provider.url, {
                ...(provider.options || {}),
                crossOrigin: true,
                updateWhenIdle: true,
                keepBuffer: 2
            });
            let isLoaded = false;
            const offlineTimeoutMs = 2200;
            const offlineTimer = setTimeout(() => {
                if (!isLoaded && context.baseTileLayer === layer && !context.offlineBackdropLayer) {
                    setOfflineBackdrop(type);
                }
            }, offlineTimeoutMs);

            layer.on('tileerror', () => {
                if (context.baseTileLayer !== layer) {
                    return;
                }

                if (context.baseTileLayerFallbackTimer) {
                    clearTimeout(context.baseTileLayerFallbackTimer);
                }

                context.baseTileLayerFallbackTimer = setTimeout(() => {
                    if (context.baseTileLayer === layer) {
                        if (providerIndex + 1 < providers.length) {
                            try {
                                context.map.removeLayer(layer);
                            } catch (error) {
                                console.warn(`Leaflet tile layer removal skipped for ${provider.name}:`, error);
                            }

                            context.baseTileLayer = null;
                            context.baseTileLayerFallbackTimer = null;
                            activateProvider(providerIndex + 1);
                            return;
                        }

                        context.baseTileLayer = null;
                        context.baseTileLayerFallbackTimer = null;
                        setOfflineBackdrop(type);
                    }
                }, 0);
            });
            layer.addTo(context.map);
            context.baseTileLayer = layer;
            layer.once('load', () => {
                isLoaded = true;
                clearTimeout(offlineTimer);
                if (context.offlineBackdropLayer) {
                    try {
                        context.map.removeLayer(context.offlineBackdropLayer);
                    } catch (error) {
                        console.warn('Leaflet offline backdrop cleanup skipped:', error);
                    }
                    context.offlineBackdropLayer = null;
                }
                _setOfflineBackdropActive(context, false);
            });
            return true;
        } catch (error) {
            console.warn(`Leaflet tile provider "${provider.name}" failed:`, error);
            if (providerIndex + 1 < providers.length) {
                return activateProvider(providerIndex + 1);
            }

            context.baseTileLayer = null;
            setOfflineBackdrop(type);
            return false;
        }
    };

    activateProvider(0);
    return true;
}

export function setOfflineBackdrop(mapTypeOrGeoJsonUrl, geoJsonUrl) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

    const isThemeKey = typeof mapTypeOrGeoJsonUrl === 'string' && Object.prototype.hasOwnProperty.call(OFFLINE_THEMES, mapTypeOrGeoJsonUrl.toLowerCase());
    const activeThemeKey = isThemeKey ? mapTypeOrGeoJsonUrl.toLowerCase() : (context.mapType || 'default');
    const sourceArg = isThemeKey ? geoJsonUrl : mapTypeOrGeoJsonUrl;
    const resolvedUrls = Array.isArray(sourceArg)
        ? sourceArg
        : (sourceArg ? [sourceArg] : OFFLINE_BACKDROP_SOURCES);
    const absoluteUrls = resolvedUrls.map(url => new URL(url, document.baseURI).toString());

    if (context.offlineBackdropLayer) {
        try {
            context.map.removeLayer(context.offlineBackdropLayer);
        } catch (error) {
            console.warn('Leaflet offline backdrop reset skipped:', error);
        }
        context.offlineBackdropLayer = null;
    }

    _removeOfflineBackdropDecorations(context);
    _setOfflineBackdropActive(context, true);

    if (context.offlineBackdropLoadPromise) {
        return true;
    }

    const paneName = 'offline-backdrop-pane';
    if (!context.map.getPane(paneName)) {
        const pane = context.map.createPane(paneName);
        pane.style.zIndex = '150';
        pane.style.pointerEvents = 'none';
    }

    context.offlineBackdropLoadPromise = Promise.allSettled(absoluteUrls.map(url =>
        fetch(url, { cache: 'force-cache' })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} while loading ${url}`);
                }

                return response.json();
            })
            .then(geoJson => ({ url, geoJson }))
    ))
        .then(results => {
            if (!context?.map || context.baseTileLayer) {
                return false;
            }

            const successful = results
                .filter(result => result.status === 'fulfilled' && result.value?.geoJson?.features?.length)
                .map(result => result.value);

            if (successful.length === 0) {
                return false;
            }

            const theme = _resolveOfflineTheme(activeThemeKey);
            const backdropGroup = L.layerGroup();
            const combinedBounds = L.latLngBounds([]);

            successful.forEach(({ geoJson }) => {
                const layer = L.geoJSON(geoJson);
                const bounds = layer.getBounds?.();
                if (bounds?.isValid?.()) {
                    combinedBounds.extend(bounds);
                }
            });

            if (!combinedBounds.isValid?.()) {
                return false;
            }

            const landHalo = L.rectangle(combinedBounds.pad(0.18), {
                pane: paneName,
                interactive: false,
                color: theme.halo,
                weight: 0.4,
                opacity: 0.18,
                fillColor: theme.land,
                fillOpacity: 0.75
            });
            backdropGroup.addLayer(landHalo);

            successful.forEach(({ url, geoJson }, index) => {
                const layer = L.geoJSON(geoJson, {
                    pane: paneName,
                    interactive: false,
                    style: feature => ({
                        color: feature?.properties?.borderColor || theme.boundaryColors[Math.min(index, theme.boundaryColors.length - 1)],
                        weight: context.map.getZoom?.() >= 9 ? 1.15 : context.map.getZoom?.() >= 7 ? 1.0 : 0.82,
                        opacity: context.map.getZoom?.() >= 9 ? 0.82 : 0.7,
                        fillColor: feature?.properties?.fillColor || theme.boundaryFills[Math.min(index, theme.boundaryFills.length - 1)],
                        fillOpacity: index === 0 ? 0.18 : index === 1 ? 0.12 : 0.08
                    })
                });

                backdropGroup.addLayer(layer);
                _createOfflineBackdropDecorations(context, { ...geoJson, url });
            });

            backdropGroup.addTo(context.map);
            context.offlineBackdropLayer = backdropGroup;
            _setOfflineBackdropActive(context, true);

            return true;
        })
        .catch(error => {
            console.warn('Leaflet offline backdrop failed:', error);
            return false;
        })
        .finally(() => {
            context.offlineBackdropLoadPromise = null;
        });

    return true;
}

export function clearMarkers() {
    const context = _getMapContext();
    if (!context) return;

    context.markers.forEach(marker => marker.remove());
    context.markers = [];
}

export function clearPolygons() {
    const context = _getMapContext();
    if (!context) return;

    context.polygons.forEach(polygon => polygon.remove());
    context.polygons = [];
}

export function clearAll() {
    clearMarkers();
    clearPolygons();

    const context = _getMapContext();
    if (!context) return;

    Object.values(context.layerGroups).forEach(group => {
        try {
            group?.clearLayers();
        } catch (error) {
            console.warn('Leaflet layer group clear skipped:', error);
        }
    });

    if (context.layerControl) {
        try {
            context.map?.removeControl(context.layerControl);
        } catch (error) {
            console.warn('Leaflet layer control removal skipped:', error);
        }
        context.layerControl = null;
    }

    if (context.legendControl) {
        try {
            context.map?.removeControl(context.legendControl);
        } catch (error) {
            console.warn('Leaflet legend control removal skipped:', error);
        }
        context.legendControl = null;
    }

    if (context.markerClusterGroup) {
        try {
            context.map?.removeLayer(context.markerClusterGroup);
        } catch (error) {
            console.warn('Leaflet marker cluster removal skipped:', error);
        }
        context.markerClusterGroup = null;
        context.clusteringEnabled = false;
    }

    if (context.offlineBackdropLayer) {
        try {
            context.map?.removeLayer(context.offlineBackdropLayer);
        } catch (error) {
            console.warn('Leaflet offline backdrop clear skipped:', error);
        }
        context.offlineBackdropLayer = null;
    }

    _removeOfflineBackdropDecorations(context);
}

export function setView(latitude, longitude, zoom) {
    const context = _getMapContext();
    if (!context?.map) return false;
    context.map.setView([latitude, longitude], zoom);
    return true;
}

export function getMapState() {
    const context = _getMapContext();
    if (!context?.map) {
        return null;
    }

    const center = context.map.getCenter();
    return {
        latitude: center?.lat ?? 0,
        longitude: center?.lng ?? 0,
        zoom: context.map.getZoom?.() ?? 0
    };
}

export function fitBounds(coordinates) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;
    const latlngs = coordinates.map(coord => [coord[0], coord[1]]);
    const bounds = L.latLngBounds(latlngs);
    context.map.fitBounds(bounds);
    return true;
}

export function invalidateSize() {
    const context = _getMapContext();
    if (context?.map) {
        context.map.invalidateSize();
    }
    return true;
}

export function setupMapClick(dotNetReference) {
    const context = _getMapContext();
    if (!context?.map) return false;
    
    context.map.on('click', function(e) {
        dotNetReference.invokeMethodAsync('OnMapClickEvent', e.latlng.lat, e.latlng.lng);
    });
    
    return true;
}

export function setupMapZoom(dotNetReference) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map || !dotNetReference) return false;

    context.map.on('zoomend', function() {
        dotNetReference.invokeMethodAsync('OnMapZoomChangedEvent', context.map.getZoom?.() ?? 0);
    });

    return true;
}

// Drawing tools for voter grouping
let drawnItems = null;
let drawControl = null;
let currentDrawing = null;

export function initializeDrawingTools(dotNetReference) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

    // Initialize FeatureGroup to store drawn items
    drawnItems = new L.FeatureGroup();
    context.map.addLayer(drawnItems);

    // Event handlers for drawing
    context.map.on(L.Draw.Event.CREATED, function (event) {
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

    context.map.on(L.Draw.Event.EDITED, function (event) {
        const layers = event.layers;
        layers.eachLayer(function (layer) {
            // Handle edited shapes
            console.log('Shape edited');
        });
    });

    context.map.on(L.Draw.Event.DELETED, function (event) {
        const layers = event.layers;
        if (dotNetReference) {
            dotNetReference.invokeMethodAsync('OnShapeDeleted');
        }
    });

    return true;
}

export function enableDrawing(shapeType) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

    // Remove existing draw control if any
    if (drawControl) {
        context.map.removeControl(drawControl);
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
    context.map.addControl(drawControl);

    return true;
}

export function disableDrawing() {
    const context = _getMapContext();
    if (drawControl) {
        context?.map?.removeControl(drawControl);
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
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;

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

        marker.addTo(context.map);
    context.markers.push(marker);
    });

    return true;
}

export function highlightVotersInArea(coordinates) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map || !coordinates || coordinates.length === 0) return false;

    const polygon = L.polygon(coordinates, {
        color: '#10b981',
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.2
    }).addTo(context.map);

    context.polygons.push(polygon);
    
    // Fit map to show the highlighted area
    context.map.fitBounds(polygon.getBounds());
    
    return true;
}

export function getVotersInShape(shapeData, voterLocations) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map || !shapeData || !voterLocations) return "[]";

    const votersInShape = [];
    
    if (shapeData.type === 'polygon' || shapeData.type === 'rectangle') {
        const polygon = L.polygon(shapeData.coordinates);
        
        voterLocations.forEach(voter => {
            const point = L.latLng(voter.latitude, voter.longitude);
            if (polygon.getBounds().contains(point)) {
                // More precise check using polygon
                const isInside = isPointInPolygon(point, shapeData.coordinates);
                if (isInside) {
                    votersInShape.push(voter.id);
                }
            }
        });
    } else if (shapeData.type === 'circle') {
        const center = L.latLng(shapeData.center.lat, shapeData.center.lng);
        
        voterLocations.forEach(voter => {
            const point = L.latLng(voter.latitude, voter.longitude);
            const distance = center.distanceTo(point);
            if (distance <= shapeData.radius) {
                votersInShape.push(voter.id);
            }
        });
    }

    return JSON.stringify(votersInShape);
}

export function getCurrentShapes() {
    if (!_leafletAvailable() || !drawnItems) return "[]";

    const shapes = [];
    
    drawnItems.eachLayer(function(layer) {
        let shapeData = null;
        
        if (layer instanceof L.Polygon) {
            const latlngs = layer.getLatLngs()[0];
            shapeData = {
                type: layer instanceof L.Rectangle ? 'rectangle' : 'polygon',
                coordinates: latlngs.map(ll => ({ lat: ll.lat, lng: ll.lng }))
            };
        } else if (layer instanceof L.Circle) {
            shapeData = {
                type: 'circle',
                center: { lat: layer.getLatLng().lat, lng: layer.getLatLng().lng },
                radius: layer.getRadius()
            };
        }
        
        if (shapeData) {
            shapes.push(shapeData);
        }
    });

    return JSON.stringify(shapes);
}

export function restoreShapes(shapesJson) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map || !drawnItems) return false;

    try {
        const shapes = JSON.parse(shapesJson);
        
        // Clear existing shapes
        drawnItems.clearLayers();
        
        shapes.forEach(shapeData => {
            let layer = null;
            
            if (shapeData.type === 'polygon') {
                const latlngs = shapeData.coordinates.map(coord => [coord.lat, coord.lng]);
                layer = L.polygon(latlngs, {
                    color: '#10b981',
                    weight: 2,
                    opacity: 0.8,
                    fillOpacity: 0.2
                });
            } else if (shapeData.type === 'rectangle') {
                const latlngs = shapeData.coordinates.map(coord => [coord.lat, coord.lng]);
                layer = L.polygon(latlngs, {
                    color: '#3388ff',
                    weight: 2,
                    opacity: 0.8,
                    fillOpacity: 0.3
                });
            } else if (shapeData.type === 'circle') {
                layer = L.circle([shapeData.center.lat, shapeData.center.lng], {
                    color: '#3388ff',
                    weight: 2,
                    opacity: 0.8,
                    fillOpacity: 0.3,
                    radius: shapeData.radius
                });
            }
            
            if (layer) {
                drawnItems.addLayer(layer);
            }
        });
        
        // Fit map to show restored shapes
        if (drawnItems.getLayers().length > 0) {
            context.map.fitBounds(drawnItems.getBounds());
        }
        
        return true;
    } catch (error) {
        console.error('Error restoring shapes:', error);
        return false;
    }
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

// Marker Clustering Functions
export function enableMarkerClustering() {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;
    
    try {
        // Check if MarkerClusterGroup is available (requires leaflet.markercluster plugin)
        if (typeof L.MarkerClusterGroup !== 'undefined') {
            if (!context.markerClusterGroup) {
                context.markerClusterGroup = L.markerClusterGroup({
                    chunkedLoading: true,
                    chunkInterval: 200,
                    chunkDelay: 50,
                    maxClusterRadius: 80,
                    spiderfyOnMaxZoom: true,
                    showCoverageOnHover: false,
                    zoomToBoundsOnClick: true,
                    iconCreateFunction: function(cluster) {
                        const count = cluster.getChildCount();
                        let size = 'small';
                        let color = '#3b82f6';
                        
                        if (count >= 100) {
                            size = 'large';
                            color = '#ef4444';
                        } else if (count >= 10) {
                            size = 'medium';
                            color = '#f59e0b';
                        }
                        
                        return L.divIcon({
                            html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${count}</div>`,
                            className: `marker-cluster marker-cluster-${size}`,
                            iconSize: [40, 40]
                        });
                    }
                });
                context.map.addLayer(context.markerClusterGroup);
            }
            context.clusteringEnabled = true;
            return true;
        } else {
            console.warn('MarkerClusterGroup not available. Please include leaflet.markercluster plugin.');
            return false;
        }
    } catch (error) {
        console.error('Error enabling marker clustering:', error);
        return false;
    }
}

export function disableMarkerClustering() {
    const context = _getMapContext();
    if (context?.markerClusterGroup && context?.map) {
        context.map.removeLayer(context.markerClusterGroup);
        context.markerClusterGroup = null;
        context.clusteringEnabled = false;
        return true;
    }
    return false;
}

export function addClusteredMarkers(markersData) {
    const context = _getMapContext();
    if (!_leafletAvailable() || !context?.map) return false;
    
    try {
        if (context.clusteringEnabled && context.markerClusterGroup) {
            // Clear existing clustered markers
            context.markerClusterGroup.clearLayers();
            
            markersData.forEach(markerData => {
                const marker = createVoterMarker(markerData);
                if (marker) {
                    context.markerClusterGroup.addLayer(marker);
                }
            });
        } else {
            // Fall back to regular markers
            addVoterMarkers(markersData);
        }
        return true;
    } catch (error) {
        console.error('Error adding clustered markers:', error);
        return false;
    }
}

function createVoterMarker(voter) {
    if (!_leafletAvailable()) return null;
    try {
        // Color code by support level
        let markerColor = '#3b82f6'; // Default blue
        if (voter.supportLevel) {
            switch (voter.supportLevel.toLowerCase()) {
                case 'strong support':
                    markerColor = '#10b981'; // Green
                    break;
                case 'moderate support':
                    markerColor = '#3b82f6'; // Blue
                    break;
                case 'weak support':
                    markerColor = '#f59e0b'; // Orange
                    break;
                case 'undecided':
                    markerColor = '#6b7280'; // Gray
                    break;
                default:
                    markerColor = '#3b82f6';
            }
        }
        
        const icon = L.divIcon({
            className: 'voter-marker',
            html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        const marker = L.marker([voter.latitude, voter.longitude], { icon })
            .bindPopup(`
                <div style="min-width: 200px;">
                    <h5 style="margin: 0 0 8px 0; color: ${markerColor};">${voter.name}</h5>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>NRC:</strong> ${voter.nrc || 'N/A'}</p>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>Area:</strong> ${voter.area || 'N/A'}</p>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>Ward:</strong> ${voter.ward || 'N/A'}</p>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>Support:</strong> <span style="color: ${markerColor}; font-weight: bold;">${voter.supportLevel || 'Unknown'}</span></p>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>Contact:</strong> ${voter.contactStatus || 'Unknown'}</p>
                    ${voter.phoneNumber ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Phone:</strong> ${voter.phoneNumber}</p>` : ''}
                </div>
            `);

        return marker;
    } catch (error) {
        console.error('Error creating voter marker:', error);
        return null;
    }
}
