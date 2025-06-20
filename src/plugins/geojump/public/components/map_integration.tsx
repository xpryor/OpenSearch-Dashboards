import React, { useEffect, useRef } from 'react';
import { GeojumpService, GeojumpEvent } from '../services/geojump_service';
import { GEOJUMP_EVENTS } from '../../common';

interface MapIntegrationProps {
  geojumpService: GeojumpService;
  mapContainer?: HTMLElement;
  onCoordinatesReceived?: (coordinates: any) => void;
}

/**
 * Component that integrates with existing map visualizations to enable geojump functionality
 */
export const MapIntegration: React.FC<MapIntegrationProps> = ({
  geojumpService,
  mapContainer,
  onCoordinatesReceived,
}) => {
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    // Subscribe to geojump events
    subscriptionRef.current = geojumpService.getEvents().subscribe((event: GeojumpEvent | null) => {
      if (!event) return;

      switch (event.type) {
        case GEOJUMP_EVENTS.JUMP_TO_COORDINATES:
          handleJumpToCoordinates(event.payload);
          break;
        case GEOJUMP_EVENTS.COORDINATES_CHANGED:
          if (onCoordinatesReceived) {
            onCoordinatesReceived(event.payload.coordinates);
          }
          break;
        default:
          break;
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [geojumpService, onCoordinatesReceived]);

  const handleJumpToCoordinates = (payload: any) => {
    const { coordinates, options } = payload;
    
    // Try to find and interact with existing map instances
    if (mapContainer) {
      jumpToCoordinatesInContainer(mapContainer, coordinates, options);
    } else {
      // Look for map containers in the DOM
      const mapContainers = findMapContainers();
      mapContainers.forEach(container => {
        jumpToCoordinatesInContainer(container, coordinates, options);
      });
    }
  };

  const findMapContainers = (): HTMLElement[] => {
    const containers: HTMLElement[] = [];
    
    // Look for common map container selectors
    const selectors = [
      '.mapboxgl-map',
      '.leaflet-container',
      '[data-test-subj*="map"]',
      '.vis-map',
      '.tile-map',
      '.region-map',
      '.embPanel__content [class*="map"]',
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          containers.push(el);
        }
      });
    });

    return containers;
  };

  const jumpToCoordinatesInContainer = (container: HTMLElement, coordinates: any, options: any) => {
    // Try different map integration approaches
    
    // 1. Try Mapbox GL JS integration
    if (tryMapboxIntegration(container, coordinates, options)) {
      return;
    }

    // 2. Try Leaflet integration
    if (tryLeafletIntegration(container, coordinates, options)) {
      return;
    }

    // 3. Try OpenSearch Dashboards specific map integration
    if (tryOpenSearchMapsIntegration(container, coordinates, options)) {
      return;
    }

    // 4. Fallback: dispatch custom events that maps can listen to
    dispatchGeojumpEvent(container, coordinates, options);
  };

  const tryMapboxIntegration = (container: HTMLElement, coordinates: any, options: any): boolean => {
    try {
      // Look for mapbox instance
      const mapboxMap = (container as any)._mapboxMap || (window as any).mapboxMap;
      
      if (mapboxMap && typeof mapboxMap.flyTo === 'function') {
        const flyToOptions: any = {
          center: [coordinates.lon, coordinates.lat],
          zoom: coordinates.zoom || options.zoomLevel || 10,
        };

        if (options.animateTransition !== false) {
          flyToOptions.duration = 2000;
        }

        mapboxMap.flyTo(flyToOptions);

        // Add marker if requested
        if (options.showMarker) {
          addMapboxMarker(mapboxMap, coordinates, options);
        }

        return true;
      }
    } catch (error) {
      console.debug('Mapbox integration failed:', error);
    }
    
    return false;
  };

  const tryLeafletIntegration = (container: HTMLElement, coordinates: any, options: any): boolean => {
    try {
      // Look for leaflet instance
      const leafletMap = (container as any)._leaflet_map || (container as any)._map;
      
      if (leafletMap && typeof leafletMap.setView === 'function') {
        const latLng = [coordinates.lat, coordinates.lon];
        const zoom = coordinates.zoom || options.zoomLevel || 10;

        if (options.animateTransition !== false) {
          leafletMap.flyTo(latLng, zoom);
        } else {
          leafletMap.setView(latLng, zoom);
        }

        // Add marker if requested
        if (options.showMarker && (window as any).L) {
          addLeafletMarker(leafletMap, coordinates, options);
        }

        return true;
      }
    } catch (error) {
      console.debug('Leaflet integration failed:', error);
    }
    
    return false;
  };

  const tryOpenSearchMapsIntegration = (container: HTMLElement, coordinates: any, options: any): boolean => {
    try {
      // Look for OpenSearch Dashboards map instances
      const mapInstance = findOpenSearchMapInstance(container);
      
      if (mapInstance) {
        // Try to call map methods if available
        if (typeof mapInstance.setCenter === 'function') {
          mapInstance.setCenter([coordinates.lat, coordinates.lon]);
        }
        
        if (typeof mapInstance.setZoom === 'function') {
          mapInstance.setZoom(coordinates.zoom || options.zoomLevel || 10);
        }

        return true;
      }
    } catch (error) {
      console.debug('OpenSearch maps integration failed:', error);
    }
    
    return false;
  };

  const findOpenSearchMapInstance = (container: HTMLElement): any => {
    // Look for map instances in various places
    const possiblePaths = [
      '_mapInstance',
      '_map',
      'mapInstance',
      'map',
    ];

    for (const path of possiblePaths) {
      if ((container as any)[path]) {
        return (container as any)[path];
      }
    }

    // Look in parent elements
    let parent = container.parentElement;
    while (parent) {
      for (const path of possiblePaths) {
        if ((parent as any)[path]) {
          return (parent as any)[path];
        }
      }
      parent = parent.parentElement;
    }

    return null;
  };

  const addMapboxMarker = (map: any, coordinates: any, options: any) => {
    try {
      if ((window as any).mapboxgl) {
        const marker = new (window as any).mapboxgl.Marker({
          color: '#FF0000',
        })
          .setLngLat([coordinates.lon, coordinates.lat])
          .addTo(map);

        // Remove marker after duration
        if (options.markerDuration) {
          setTimeout(() => {
            marker.remove();
          }, options.markerDuration);
        }
      }
    } catch (error) {
      console.debug('Failed to add Mapbox marker:', error);
    }
  };

  const addLeafletMarker = (map: any, coordinates: any, options: any) => {
    try {
      const L = (window as any).L;
      if (L) {
        const marker = L.marker([coordinates.lat, coordinates.lon], {
          icon: L.icon({
            iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5QzkuNSA3LjYyIDEwLjYyIDYuNSAxMiA2LjVDMTMuMzggNi41IDE0LjUgNy42MiAxNC41IDlDMTQuNSAxMC4zOCAxMy4zOCAxMS41IDEyIDExLjVaIiBmaWxsPSIjRkYwMDAwIi8+Cjwvc3ZnPgo=',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          }),
        }).addTo(map);

        // Remove marker after duration
        if (options.markerDuration) {
          setTimeout(() => {
            map.removeLayer(marker);
          }, options.markerDuration);
        }
      }
    } catch (error) {
      console.debug('Failed to add Leaflet marker:', error);
    }
  };

  const dispatchGeojumpEvent = (container: HTMLElement, coordinates: any, options: any) => {
    // Dispatch custom event that maps can listen to
    const event = new CustomEvent('geojump', {
      detail: {
        coordinates,
        options,
      },
      bubbles: true,
    });

    container.dispatchEvent(event);
    
    // Also dispatch on document for global listeners
    document.dispatchEvent(event);
  };

  // This component doesn't render anything visible
  return null;
};
