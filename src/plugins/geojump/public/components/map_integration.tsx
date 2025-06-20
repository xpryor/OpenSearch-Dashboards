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
    console.log('🔍 GeoJump DEBUG: Handling jump to coordinates:', coordinates, 'with options:', options);
    
    // Try to find and interact with existing map instances
    if (mapContainer) {
      console.log('🔍 GeoJump DEBUG: Using provided map container:', mapContainer);
      jumpToCoordinatesInContainer(mapContainer, coordinates, options);
    } else {
      // Look for map containers in the DOM
      const mapContainers = findMapContainers();
      console.log('🔍 GeoJump DEBUG: Found map containers:', mapContainers.length);
      
      if (mapContainers.length === 0) {
        // If no map containers found, try a more aggressive approach
        console.log('🔍 GeoJump DEBUG: No map containers found, trying direct map access');
        tryDirectMapAccess(coordinates, options);
      } else {
        console.log('🔍 GeoJump DEBUG: Found map containers:', mapContainers);
        mapContainers.forEach((container, index) => {
          console.log(`🔍 GeoJump DEBUG: Attempting to jump in container ${index}:`, container);
          jumpToCoordinatesInContainer(container, coordinates, options);
        });
      }
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
      // Add more specific selectors for OpenSearch Dashboards maps
      '.visMapChart',
      '.mapContainer',
      '.mapboxgl-canvas-container',
      '.leaflet-map-pane',
      // Dashboard specific selectors
      '.embPanel [data-render-complete="true"]',
      '.visWrapper',
      // Additional OpenSearch Dashboards map selectors
      '.visChart',
      '.visLib--legend-value-title-label',
      '.visWrapper__column--100',
      '.visChart__container',
      '.visChart__canvas',
      '.visChart__canvas--geo',
      '.visChart__canvas--tilemap',
      '.visChart__canvas--regionmap',
      '.leaflet-container',
      '.leaflet-pane',
      '.mapContainer',
      '.mapboxgl-canvas',
      '.mapboxgl-map',
    ];

    console.log('🔍 GeoJump DEBUG: Searching for map containers with selectors:', selectors);
    
    // Log all elements that match any selector
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`🔍 GeoJump DEBUG: Found ${elements.length} elements matching selector "${selector}":`, elements);
      
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          containers.push(el);
        }
      });
    });

    console.log('🔍 GeoJump DEBUG: Total map containers found:', containers.length);
    return containers;
  };

  const jumpToCoordinatesInContainer = (container: HTMLElement, coordinates: any, options: any): boolean => {
    console.log('🔍 GeoJump DEBUG: Attempting to jump in container:', container);
    console.log('🔍 GeoJump DEBUG: Container properties:', {
      id: container.id,
      className: container.className,
      tagName: container.tagName,
      attributes: Array.from(container.attributes).map(attr => `${attr.name}="${attr.value}"`),
      children: container.children.length,
      dataset: container.dataset,
    });
    
    // Try different map integration approaches
    
    // 1. Try Mapbox GL JS integration
    if (tryMapboxIntegration(container, coordinates, options)) {
      console.log('🔍 GeoJump DEBUG: Successfully used Mapbox integration');
      return true;
    }

    // 2. Try Leaflet integration
    if (tryLeafletIntegration(container, coordinates, options)) {
      console.log('🔍 GeoJump DEBUG: Successfully used Leaflet integration');
      return true;
    }

    // 3. Try OpenSearch Dashboards specific map integration
    if (tryOpenSearchMapsIntegration(container, coordinates, options)) {
      console.log('🔍 GeoJump DEBUG: Successfully used OpenSearch maps integration');
      return true;
    }

    // 4. Fallback: dispatch custom events that maps can listen to
    console.log('🔍 GeoJump DEBUG: Using fallback: dispatching geojump event');
    dispatchGeojumpEvent(container, coordinates, options);
    
    return false;
  };

  const tryDirectMapAccess = (coordinates: any, options: any): boolean => {
    console.log('🔍 GeoJump DEBUG: Trying direct map access');
    
    // Try to access maps through global variables
    const win = window as any;
    
    // Check for common map instances in the global scope
    const possibleMapInstances = [
      win.map,
      win.leafletMap,
      win.mapboxMap,
      win.mapInstance,
      win.visMap,
      win.__map,
      win.__mapInstance,
    ];
    
    // Try to find map instances in the global scope
    for (const mapInstance of possibleMapInstances) {
      if (mapInstance) {
        console.log('🔍 GeoJump DEBUG: Found global map instance:', mapInstance);
        
        // Try to use the map instance
        if (tryUseMapInstance(mapInstance, coordinates, options)) {
          return true;
        }
      }
    }
    
    // Try to access OpenSearch Dashboards visualizations directly
    console.log('🔍 GeoJump DEBUG: Trying to access OpenSearch Dashboards visualizations directly');
    
    // Try to find the OpenSearch Dashboards visualization registry
    if (win.__osdAppPlugins && win.__osdAppPlugins.visualizations) {
      console.log('🔍 GeoJump DEBUG: Found OpenSearch Dashboards visualization registry');
      
      // Try to find map visualizations
      const visualizations = win.__osdAppPlugins.visualizations;
      console.log('🔍 GeoJump DEBUG: Available visualizations:', visualizations);
      
      // Try to find map visualizations
      const mapVisualizations = Object.values(visualizations).filter((vis: any) => 
        vis.name && (vis.name.toLowerCase().includes('map') || vis.name.toLowerCase().includes('tile') || vis.name.toLowerCase().includes('region'))
      );
      
      console.log('🔍 GeoJump DEBUG: Found map visualizations:', mapVisualizations);
      
      // Try to access the map instances
      for (const vis of mapVisualizations) {
        if (vis.getInstances && typeof vis.getInstances === 'function') {
          const instances = vis.getInstances();
          console.log('🔍 GeoJump DEBUG: Visualization instances:', instances);
          
          for (const instance of instances) {
            if (tryUseMapInstance(instance, coordinates, options)) {
              return true;
            }
          }
        }
      }
    }
    
    // Try to find maps in the DOM
    console.log('🔍 GeoJump DEBUG: Trying to find maps in DOM elements');
    
    // Look for elements that might contain map instances
    const elements = document.querySelectorAll('*');
    let mapFound = false;
    
    elements.forEach(el => {
      if (mapFound) return;
      
      // Check if the element has map-related properties
      const element = el as any;
      
      // Check for common map properties
      const mapProps = ['_map', 'map', 'mapInstance', '_mapInstance', '__map'];
      
      for (const prop of mapProps) {
        if (element[prop] && typeof element[prop] === 'object') {
          console.log('🔍 GeoJump DEBUG: Found map in DOM element:', element, prop, element[prop]);
          
          if (tryUseMapInstance(element[prop], coordinates, options)) {
            mapFound = true;
            return;
          }
        }
      }
    });
    
    // Try to find OpenSearch Dashboards visualizations
    console.log('🔍 GeoJump DEBUG: Trying to find OpenSearch Dashboards visualizations');
    
    // Look for visualization elements
    const visElements = document.querySelectorAll('.visualization, .visWrapper, .embPanel');
    
    visElements.forEach(el => {
      if (mapFound) return;
      
      const element = el as any;
      
      // Try to access the visualization
      const vis = element.vis || element._vis || element.visualization;
      
      if (vis) {
        console.log('🔍 GeoJump DEBUG: Found visualization:', vis);
        
        // Try to access the map
        const visMap = (vis as any).map || (vis as any)._map || (vis as any).handler?.maps?.[0];
        
        if (visMap) {
          console.log('🔍 GeoJump DEBUG: Found visualization map:', visMap);
          
          if (tryUseMapInstance(visMap, coordinates, options)) {
            mapFound = true;
            return;
          }
        }
      }
    });
    
    // Try to find and update filters
    console.log('🔍 GeoJump DEBUG: Trying to update filters');
    
    // Try to find dashboard filters
    const dashboard = (document.querySelector('.dashboard') as any)?.dashboard || 
                      win.dashboard || 
                      win.__dashboardContext;
                      
    if (dashboard && dashboard.filters) {
      console.log('🔍 GeoJump DEBUG: Found dashboard filters:', dashboard.filters);
      
      // Find geo filters
      const geoFilters = (dashboard.filters || []).filter((filter: any) => {
        return filter.type === 'geo_distance' || 
               filter.type === 'geo_bounding_box' || 
               filter.meta?.type === 'geo_distance' || 
               filter.meta?.type === 'geo_bounding_box';
      });
      
      if (geoFilters.length > 0) {
        console.log('🔍 GeoJump DEBUG: Found geo filters:', geoFilters);
        updateGeoFilters(geoFilters, coordinates);
        return true;
      }
    }
    
    // Try to find map canvas elements
    console.log('🔍 GeoJump DEBUG: Trying to find map canvas elements');
    
    const canvasElements = document.querySelectorAll('canvas');
    
    canvasElements.forEach(canvas => {
      if (mapFound) return;
      
      // Check if this canvas is part of a map
      const parent = canvas.parentElement;
      
      if (parent && (
          parent.classList.contains('mapboxgl-canvas-container') || 
          parent.classList.contains('leaflet-layer') ||
          parent.closest('.visMapChart') ||
          parent.closest('.mapContainer')
      )) {
        console.log('🔍 GeoJump DEBUG: Found map canvas:', canvas, 'in parent:', parent);
        
        // Try to find the map instance
        const mapContainer = parent.closest('.mapboxgl-map') || 
                             parent.closest('.leaflet-container') || 
                             parent.closest('.visMapChart') || 
                             parent.closest('.mapContainer');
                             
        if (mapContainer) {
          console.log('🔍 GeoJump DEBUG: Found map container:', mapContainer);
          
          // Try to jump to coordinates in this container
          if (jumpToCoordinatesInContainer(mapContainer as HTMLElement, coordinates, options)) {
            mapFound = true;
            return;
          }
        }
      }
    });
    
    // Try to access the OpenSearch Dashboards map API directly
    console.log('🔍 GeoJump DEBUG: Trying to access OpenSearch Dashboards map API directly');
    
    // Look for the OpenSearch Dashboards map API
    if (win.OpenSearchDashboards && win.OpenSearchDashboards.maps) {
      console.log('🔍 GeoJump DEBUG: Found OpenSearchDashboards.maps API:', win.OpenSearchDashboards.maps);
      
      // Try to use the map API
      const mapsAPI = win.OpenSearchDashboards.maps;
      
      if (mapsAPI.getMapInstances && typeof mapsAPI.getMapInstances === 'function') {
        const mapInstances = mapsAPI.getMapInstances();
        console.log('🔍 GeoJump DEBUG: Map instances from API:', mapInstances);
        
        for (const instance of mapInstances) {
          if (tryUseMapInstance(instance, coordinates, options)) {
            return true;
          }
        }
      }
    }
    
    // If all else fails, try to dispatch a custom event
    if (!mapFound) {
      console.log('🔍 GeoJump DEBUG: No map found, dispatching global geojump event');
      
      // Create a custom event
      const event = new CustomEvent('geojump', {
        detail: {
          coordinates,
          options,
        },
        bubbles: true,
      });
      
      // Dispatch on document
      document.dispatchEvent(event);
      
      // Also try to dispatch on all potential map containers
      const potentialMapContainers = document.querySelectorAll('.visualization, .visWrapper, .embPanel, .mapContainer, .visMapChart');
      
      potentialMapContainers.forEach(container => {
        container.dispatchEvent(new CustomEvent('geojump', {
          detail: {
            coordinates,
            options,
          },
          bubbles: true,
        }));
      });
    }
    
    return mapFound;
  };

  const tryUseMapInstance = (mapInstance: any, coordinates: any, options: any): boolean => {
    try {
      console.log('Trying to use map instance:', mapInstance);
      
      // Try different map methods
      
      // Leaflet-style setView
      if (typeof mapInstance.setView === 'function') {
        console.log('Using setView method');
        mapInstance.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        return true;
      }
      
      // Mapbox-style flyTo
      if (typeof mapInstance.flyTo === 'function') {
        console.log('Using flyTo method');
        mapInstance.flyTo({
          center: [coordinates.lon, coordinates.lat],
          zoom: coordinates.zoom || options.zoomLevel || 10,
          duration: options.animateTransition !== false ? 2000 : 0,
        });
        return true;
      }
      
      // Separate setCenter and setZoom methods
      if (typeof mapInstance.setCenter === 'function') {
        console.log('Using setCenter method');
        mapInstance.setCenter([coordinates.lat, coordinates.lon]);
        
        if (typeof mapInstance.setZoom === 'function') {
          console.log('Using setZoom method');
          mapInstance.setZoom(coordinates.zoom || options.zoomLevel || 10);
        }
        
        return true;
      }
      
      // Try to access the map's internal methods
      if (mapInstance._map) {
        console.log('Trying internal _map');
        return tryUseMapInstance(mapInstance._map, coordinates, options);
      }
      
      // Try to access the map's handler
      if (mapInstance.handler && mapInstance.handler.maps && mapInstance.handler.maps.length > 0) {
        console.log('Trying handler.maps[0]');
        return tryUseMapInstance(mapInstance.handler.maps[0], coordinates, options);
      }
      
      // Try to update the map's parameters
      if (mapInstance.params) {
        console.log('Updating map params');
        mapInstance.params.mapCenter = [coordinates.lat, coordinates.lon];
        mapInstance.params.mapZoom = coordinates.zoom || options.zoomLevel || 10;
        
        // Try to trigger a render
        if (typeof mapInstance.render === 'function') {
          console.log('Calling render method');
          mapInstance.render();
          return true;
        }
      }
    } catch (error) {
      console.debug('Failed to use map instance:', error);
    }
    
    return false;
  };

  const tryMapboxIntegration = (container: HTMLElement, coordinates: any, options: any): boolean => {
    try {
      // Look for mapbox instance
      const mapboxMap = (container as any)._mapboxMap || (window as any).mapboxMap;
      
      if (mapboxMap && typeof mapboxMap.flyTo === 'function') {
        console.log('Found Mapbox map instance');
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
        console.log('Found Leaflet map instance');
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
        console.log('🔍 GeoJump DEBUG: Found OpenSearch map instance:', mapInstance);
        console.log('🔍 GeoJump DEBUG: Map instance methods:', Object.getOwnPropertyNames(mapInstance).filter(prop => typeof mapInstance[prop] === 'function'));
        console.log('🔍 GeoJump DEBUG: Map instance properties:', Object.getOwnPropertyNames(mapInstance).filter(prop => typeof mapInstance[prop] !== 'function'));
        
        // Try to call map methods if available
        if (typeof mapInstance.setCenter === 'function') {
          console.log('🔍 GeoJump DEBUG: Setting center to:', [coordinates.lat, coordinates.lon]);
          mapInstance.setCenter([coordinates.lat, coordinates.lon]);
          return true;
        }
        
        if (typeof mapInstance.setZoom === 'function') {
          console.log('🔍 GeoJump DEBUG: Setting zoom to:', coordinates.zoom || options.zoomLevel || 10);
          mapInstance.setZoom(coordinates.zoom || options.zoomLevel || 10);
          return true;
        }

        // Try alternative methods for OpenSearch maps
        if (typeof mapInstance.setView === 'function') {
          console.log('🔍 GeoJump DEBUG: Setting view to:', [coordinates.lat, coordinates.lon]);
          mapInstance.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
          return true;
        }

        // Try to access the map's internal methods
        if (mapInstance._map && typeof mapInstance._map.setView === 'function') {
          console.log('🔍 GeoJump DEBUG: Setting view on _map to:', [coordinates.lat, coordinates.lon]);
          mapInstance._map.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
          return true;
        }

        // Try to find and update filter values for geofilters
        const geoFilters = findGeoFilters(container);
        if (geoFilters.length > 0) {
          console.log('🔍 GeoJump DEBUG: Found geo filters:', geoFilters);
          updateGeoFilters(geoFilters, coordinates);
          return true;
        }
        
        // Try to access map through _leaflet_map property
        if (mapInstance._leaflet_map) {
          console.log('🔍 GeoJump DEBUG: Found _leaflet_map property:', mapInstance._leaflet_map);
          if (typeof mapInstance._leaflet_map.setView === 'function') {
            mapInstance._leaflet_map.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
            return true;
          }
        }
        
        // Try to access map through chart property
        if (mapInstance.chart) {
          console.log('🔍 GeoJump DEBUG: Found chart property:', mapInstance.chart);
          if (typeof mapInstance.chart.setView === 'function') {
            mapInstance.chart.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
            return true;
          }
        }
      } else {
        console.log('🔍 GeoJump DEBUG: No OpenSearch map instance found in container');
      }

      // Try to find map in visualization
      const visMap = findVisualizationMap(container);
      if (visMap) {
        console.log('🔍 GeoJump DEBUG: Found visualization map:', visMap);
        console.log('🔍 GeoJump DEBUG: Visualization map methods:', Object.getOwnPropertyNames(visMap).filter(prop => typeof visMap[prop] === 'function'));
        console.log('🔍 GeoJump DEBUG: Visualization map properties:', Object.getOwnPropertyNames(visMap).filter(prop => typeof visMap[prop] !== 'function'));
        return handleVisualizationMap(visMap, coordinates, options);
      } else {
        console.log('🔍 GeoJump DEBUG: No visualization map found in container');
      }
    } catch (error) {
      console.debug('🔍 GeoJump DEBUG: OpenSearch maps integration failed:', error);
    }
    
    return false;
  };

  const findOpenSearchMapInstance = (container: HTMLElement): any => {
    console.log('🔍 GeoJump DEBUG: Searching for map instance in container:', container);
    
    // Look for map instances in various places
    const possiblePaths = [
      '_mapInstance',
      '_map',
      'mapInstance',
      'map',
      '__map',
      'visMap',
      'chart',
      'leafletMap',
      '_leaflet_map',
      'mapboxMap',
      '_mapboxMap',
      'tileMap',
      'regionMap',
      'visController',
      'handler',
      'visualization',
      'vis',
    ];

    console.log('🔍 GeoJump DEBUG: Checking for map properties:', possiblePaths);

    // First check the container itself
    for (const path of possiblePaths) {
      if ((container as any)[path]) {
        console.log(`🔍 GeoJump DEBUG: Found map instance at container.${path}:`, (container as any)[path]);
        return (container as any)[path];
      }
    }

    // Look in parent elements
    let parent = container.parentElement;
    while (parent) {
      for (const path of possiblePaths) {
        if ((parent as any)[path]) {
          console.log(`🔍 GeoJump DEBUG: Found map instance at parent.${path}:`, (parent as any)[path]);
          return (parent as any)[path];
        }
      }
      parent = parent.parentElement;
    }

    // Look in child elements (some maps store the instance in a child)
    const findInChildren = (element: HTMLElement): any => {
      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i] as HTMLElement;
        
        for (const path of possiblePaths) {
          if ((child as any)[path]) {
            console.log(`🔍 GeoJump DEBUG: Found map instance at child.${path}:`, (child as any)[path]);
            return (child as any)[path];
          }
        }
        
        // Recursively check children
        const result = findInChildren(child);
        if (result) return result;
      }
      return null;
    };
    
    const childResult = findInChildren(container);
    if (childResult) {
      return childResult;
    }
    
    // Look for specific OpenSearch Dashboards map elements
    const mapElements = container.querySelectorAll('.leaflet-container, .mapboxgl-map, .visChart__canvas');
    console.log('🔍 GeoJump DEBUG: Found map elements:', mapElements);
    
    if (mapElements.length > 0) {
      const mapElement = mapElements[0] as HTMLElement;
      
      // Check for map instance in this element
      for (const path of possiblePaths) {
        if ((mapElement as any)[path]) {
          console.log(`🔍 GeoJump DEBUG: Found map instance at mapElement.${path}:`, (mapElement as any)[path]);
          return (mapElement as any)[path];
        }
      }
      
      // Try to find the Leaflet or Mapbox instance
      if (mapElement.classList.contains('leaflet-container')) {
        // For Leaflet maps
        const leafletMap = (mapElement as any)._leaflet_map;
        if (leafletMap) {
          console.log('🔍 GeoJump DEBUG: Found Leaflet map instance:', leafletMap);
          return leafletMap;
        }
      } else if (mapElement.classList.contains('mapboxgl-map')) {
        // For Mapbox maps
        const mapboxMap = (mapElement as any)._mapboxMap;
        if (mapboxMap) {
          console.log('🔍 GeoJump DEBUG: Found Mapbox map instance:', mapboxMap);
          return mapboxMap;
        }
      }
    }
    
    console.log('🔍 GeoJump DEBUG: No map instance found');
    return null;
  };

  const findVisualizationMap = (container: HTMLElement): any => {
    // Try to find visualization components
    const visElement = container.closest('.visualization') || 
                       container.closest('.visWrapper') || 
                       container.closest('.embPanel');
                       
    if (!visElement) return null;
    
    // Try to access the visualization's controller or handler
    const vis = (visElement as any).vis || 
                (visElement as any)._vis || 
                (visElement as any).visualization;
                
    if (!vis) return null;
    
    // Try to get the map from the visualization
    return (vis as any).map || (vis as any)._map || (vis as any).handler?.maps?.[0];
  };

  const handleVisualizationMap = (visMap: any, coordinates: any, options: any): boolean => {
    try {
      // Try different approaches to update the visualization map
      
      // 1. Try direct map methods
      if (typeof visMap.setView === 'function') {
        visMap.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        return true;
      }
      
      // 2. Try to update the map's parameters
      if (visMap.params) {
        visMap.params.mapCenter = [coordinates.lat, coordinates.lon];
        visMap.params.mapZoom = coordinates.zoom || options.zoomLevel || 10;
        
        // Try to trigger a render
        if (typeof visMap.render === 'function') {
          visMap.render();
          return true;
        }
      }
      
      // 3. Try to access the underlying map library
      if (visMap._leafletMap) {
        visMap._leafletMap.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        return true;
      }
      
      if (visMap._mapboxMap) {
        visMap._mapboxMap.flyTo({
          center: [coordinates.lon, coordinates.lat],
          zoom: coordinates.zoom || options.zoomLevel || 10
        });
        return true;
      }
    } catch (error) {
      console.debug('Visualization map handling failed:', error);
    }
    
    return false;
  };

  const findGeoFilters = (container: HTMLElement): any[] => {
    // Try to find the dashboard or visualization container
    const dashboardEl = container.closest('.dashboard') || 
                        container.closest('.embPanel') || 
                        document.querySelector('.dashboard');
                        
    if (!dashboardEl) return [];
    
    // Try to access the filters
    const dashboard = (dashboardEl as any).dashboard || 
                      (window as any).dashboard || 
                      (window as any).__dashboardContext;
                      
    if (!dashboard || !dashboard.filters) return [];
    
    // Find geo filters
    return (dashboard.filters || []).filter((filter: any) => {
      return filter.type === 'geo_distance' || 
             filter.type === 'geo_bounding_box' || 
             filter.meta?.type === 'geo_distance' || 
             filter.meta?.type === 'geo_bounding_box';
    });
  };

  const updateGeoFilters = (geoFilters: any[], coordinates: any): void => {
    geoFilters.forEach(filter => {
      try {
        // Update geo_distance filter
        if (filter.type === 'geo_distance' || filter.meta?.type === 'geo_distance') {
          const geoFilter = filter.meta ? filter.meta : filter;
          
          if (geoFilter.params) {
            geoFilter.params.lat = coordinates.lat;
            geoFilter.params.lon = coordinates.lon;
          } else if (geoFilter.value) {
            geoFilter.value.lat = coordinates.lat;
            geoFilter.value.lon = coordinates.lon;
          }
        }
        
        // Update geo_bounding_box filter
        if (filter.type === 'geo_bounding_box' || filter.meta?.type === 'geo_bounding_box') {
          const geoFilter = filter.meta ? filter.meta : filter;
          const radius = 0.1; // Approximately 11km at the equator
          
          if (geoFilter.params) {
            geoFilter.params.top_left = {
              lat: coordinates.lat + radius,
              lon: coordinates.lon - radius
            };
            geoFilter.params.bottom_right = {
              lat: coordinates.lat - radius,
              lon: coordinates.lon + radius
            };
          } else if (geoFilter.value) {
            geoFilter.value.top_left = {
              lat: coordinates.lat + radius,
              lon: coordinates.lon - radius
            };
            geoFilter.value.bottom_right = {
              lat: coordinates.lat - radius,
              lon: coordinates.lon + radius
            };
          }
        }
        
        // Try to trigger filter update
        if (filter.meta && typeof filter.meta.apply === 'function') {
          filter.meta.apply();
        }
      } catch (error) {
        console.debug('Failed to update geo filter:', error);
      }
    });
    
    // Try to trigger dashboard update
    try {
      const dashboard = (document.querySelector('.dashboard') as any)?.dashboard || 
                        (window as any).dashboard || 
                        (window as any).__dashboardContext;
                        
      if (dashboard && typeof dashboard.updateFilters === 'function') {
        dashboard.updateFilters();
      }
    } catch (error) {
      console.debug('Failed to update dashboard filters:', error);
    }
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
