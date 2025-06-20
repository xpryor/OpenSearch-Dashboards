/**
 * Enhanced Map Interceptor - Capture maps from OpenSearch Dashboards internal creation
 */

import { GeojumpCoordinates, GeojumpOptions } from '../../common';

// Global storage for captured maps
declare global {
  interface Window {
    __capturedLeafletMaps: any[];
    __originalLeafletMap: any;
    __geojumpMapInterceptor: any;
    __originalOpenSearchDashboardsMap: any;
  }
}

// Initialize global storage
window.__capturedLeafletMaps = window.__capturedLeafletMaps || [];

/**
 * Set up the enhanced map interceptor
 */
export function initializeMapInterceptor(): void {
  console.log('🔍 GeoJump DEBUG: Initializing enhanced map interceptor');
  
  // Set up multiple interception points
  setupLeafletInterceptor();
  setupOpenSearchDashboardsMapInterceptor();
  setupDOMObserver();
  setupReactComponentInterceptor();
}

/**
 * Set up standard Leaflet interceptor
 */
function setupLeafletInterceptor(): void {
  const checkLeaflet = () => {
    const L = (window as any).L;
    if (L && L.map && !window.__originalLeafletMap) {
      console.log('🔍 GeoJump DEBUG: Leaflet detected, setting up standard interceptor');
      
      // Store the original map constructor
      window.__originalLeafletMap = L.map;
      
      // Override the map constructor
      L.map = function(element: any, options: any = {}) {
        console.log('🔍 GeoJump DEBUG: Intercepting L.map() call');
        
        // Call the original constructor
        const mapInstance = window.__originalLeafletMap.call(this, element, options);
        
        console.log('🔍 GeoJump DEBUG: Created map instance via L.map():', mapInstance);
        captureMapInstance(mapInstance, element, options, 'L.map');
        
        return mapInstance;
      };
      
      // Copy over static properties
      Object.setPrototypeOf(L.map, window.__originalLeafletMap);
      Object.assign(L.map, window.__originalLeafletMap);
      
      console.log('🔍 GeoJump DEBUG: Standard Leaflet interceptor set up');
    } else {
      setTimeout(checkLeaflet, 100);
    }
  };
  
  checkLeaflet();
}

/**
 * Set up OpenSearch Dashboards specific map interceptor
 */
function setupOpenSearchDashboardsMapInterceptor(): void {
  // Intercept the OpenSearchDashboardsMap class creation
  const checkOpenSearchMaps = () => {
    // Look for the OpenSearchDashboardsMap class in the maps_legacy plugin
    const win = window as any;
    
    // Try to find the OpenSearchDashboardsMap constructor
    if (win.OpenSearchDashboardsMap) {
      console.log('🔍 GeoJump DEBUG: Found OpenSearchDashboardsMap, setting up interceptor');
      interceptOpenSearchDashboardsMap(win.OpenSearchDashboardsMap);
    } else {
      // Try to find it in various locations
      const possibleLocations = [
        win.__osdAppPlugins?.mapsLegacy?.OpenSearchDashboardsMap,
        win.mapsLegacy?.OpenSearchDashboardsMap,
        win.plugins?.mapsLegacy?.OpenSearchDashboardsMap,
      ];
      
      for (const location of possibleLocations) {
        if (location) {
          console.log('🔍 GeoJump DEBUG: Found OpenSearchDashboardsMap at alternative location');
          interceptOpenSearchDashboardsMap(location);
          return;
        }
      }
      
      setTimeout(checkOpenSearchMaps, 200);
    }
  };
  
  checkOpenSearchMaps();
}

/**
 * Intercept OpenSearchDashboardsMap constructor
 */
function interceptOpenSearchDashboardsMap(OpenSearchDashboardsMapClass: any): void {
  if (window.__originalOpenSearchDashboardsMap) {
    return; // Already intercepted
  }
  
  console.log('🔍 GeoJump DEBUG: Setting up OpenSearchDashboardsMap interceptor');
  
  // Store original constructor
  window.__originalOpenSearchDashboardsMap = OpenSearchDashboardsMapClass;
  
  // Create wrapper constructor
  const InterceptedOpenSearchDashboardsMap = function(containerNode: any, options: any) {
    console.log('🔍 GeoJump DEBUG: Intercepting OpenSearchDashboardsMap creation');
    console.log('🔍 GeoJump DEBUG: Container:', containerNode);
    console.log('🔍 GeoJump DEBUG: Options:', options);
    
    // Call original constructor
    const instance = new window.__originalOpenSearchDashboardsMap(containerNode, options);
    
    console.log('🔍 GeoJump DEBUG: Created OpenSearchDashboardsMap instance:', instance);
    
    // The OpenSearchDashboardsMap should have a _leafletMap property
    if (instance._leafletMap) {
      console.log('🔍 GeoJump DEBUG: Found _leafletMap in OpenSearchDashboardsMap:', instance._leafletMap);
      captureMapInstance(instance._leafletMap, containerNode, options, 'OpenSearchDashboardsMap');
    }
    
    // Also capture the wrapper itself
    captureMapInstance(instance, containerNode, options, 'OpenSearchDashboardsMapWrapper');
    
    return instance;
  };
  
  // Copy prototype and static properties
  InterceptedOpenSearchDashboardsMap.prototype = OpenSearchDashboardsMapClass.prototype;
  Object.setPrototypeOf(InterceptedOpenSearchDashboardsMap, OpenSearchDashboardsMapClass);
  Object.assign(InterceptedOpenSearchDashboardsMap, OpenSearchDashboardsMapClass);
  
  // Replace the original
  (window as any).OpenSearchDashboardsMap = InterceptedOpenSearchDashboardsMap;
}

/**
 * Set up DOM observer to catch maps created after page load
 */
function setupDOMObserver(): void {
  console.log('🔍 GeoJump DEBUG: Setting up DOM observer for map detection');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            // Check if this is a map container
            if (element.classList.contains('leaflet-container')) {
              console.log('🔍 GeoJump DEBUG: Detected new Leaflet container via DOM observer:', element);
              
              // Try to find the map instance
              setTimeout(() => {
                const mapInstance = findMapInstanceInElement(element);
                if (mapInstance) {
                  console.log('🔍 GeoJump DEBUG: Found map instance in new container:', mapInstance);
                  captureMapInstance(mapInstance, element, {}, 'DOMObserver');
                }
              }, 100);
            }
            
            // Also check children
            const leafletContainers = element.querySelectorAll('.leaflet-container');
            leafletContainers.forEach((container) => {
              console.log('🔍 GeoJump DEBUG: Detected Leaflet container in new element:', container);
              
              setTimeout(() => {
                const mapInstance = findMapInstanceInElement(container as HTMLElement);
                if (mapInstance) {
                  console.log('🔍 GeoJump DEBUG: Found map instance in child container:', mapInstance);
                  captureMapInstance(mapInstance, container, {}, 'DOMObserver');
                }
              }, 100);
            });
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Set up React component interceptor
 */
function setupReactComponentInterceptor(): void {
  // Try to intercept React component creation for map components
  const originalCreateElement = React.createElement;
  
  React.createElement = function(type: any, props: any, ...children: any[]) {
    const element = originalCreateElement.apply(this, arguments);
    
    // Check if this might be a map-related component
    if (type && typeof type === 'function' && type.name) {
      const componentName = type.name.toLowerCase();
      if (componentName.includes('map') || componentName.includes('visualization')) {
        console.log('🔍 GeoJump DEBUG: Detected map-related React component:', type.name, props);
      }
    }
    
    return element;
  };
}

/**
 * Find map instance in a DOM element
 */
function findMapInstanceInElement(element: HTMLElement): any {
  const possibleProps = [
    '_leaflet_map',
    '_map',
    'map',
    'mapInstance',
    '__leafletMapInstance',
    '_mapInstance',
  ];
  
  for (const prop of possibleProps) {
    if ((element as any)[prop]) {
      return (element as any)[prop];
    }
  }
  
  return null;
}

/**
 * Capture a map instance
 */
function captureMapInstance(mapInstance: any, element: any, options: any, source: string): void {
  if (!mapInstance) return;
  
  console.log(`🔍 GeoJump DEBUG: Capturing map instance from ${source}:`, mapInstance);
  
  // Check if we already have this instance
  const existing = window.__capturedLeafletMaps.find(m => m.instance === mapInstance);
  if (existing) {
    console.log('🔍 GeoJump DEBUG: Map instance already captured');
    return;
  }
  
  // Store the map instance
  window.__capturedLeafletMaps.push({
    instance: mapInstance,
    element: element,
    options: options,
    timestamp: Date.now(),
    source: source,
  });
  
  console.log(`🔍 GeoJump DEBUG: Total captured maps: ${window.__capturedLeafletMaps.length}`);
  
  // Set up event listeners
  if (typeof mapInstance.on === 'function') {
    mapInstance.on('moveend', () => {
      const center = mapInstance.getCenter ? mapInstance.getCenter() : null;
      const zoom = mapInstance.getZoom ? mapInstance.getZoom() : null;
      console.log(`🔍 GeoJump DEBUG: Map moved (${source}):`, { center, zoom });
    });
  }
  
  // Store reference on DOM element
  if (element && element.nodeType) {
    (element as any).__leafletMapInstance = mapInstance;
  }
}

/**
 * Get all captured map instances
 */
export function getCapturedMaps(): any[] {
  return window.__capturedLeafletMaps || [];
}

/**
 * Jump to coordinates using captured map instances
 */
export function jumpToCoordinatesWithInterceptor(
  coordinates: GeojumpCoordinates, 
  options: GeojumpOptions = {}
): boolean {
  console.log('🔍 GeoJump DEBUG: Jumping with interceptor to:', coordinates);
  
  const maps = getCapturedMaps();
  console.log('🔍 GeoJump DEBUG: Available captured maps:', maps.length);
  
  if (maps.length === 0) {
    console.log('🔍 GeoJump DEBUG: No captured maps available');
    return false;
  }
  
  let success = false;
  
  maps.forEach((mapData, index) => {
    const map = mapData.instance;
    console.log(`🔍 GeoJump DEBUG: Trying map ${index} (${mapData.source}):`, map);
    
    try {
      // Try different methods based on map type
      if (typeof map.setView === 'function') {
        console.log(`🔍 GeoJump DEBUG: Using setView on map ${index}`);
        map.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        console.log(`🔍 GeoJump DEBUG: Successfully jumped on map ${index}!`);
        success = true;
      } else if (typeof map.setCenter === 'function' && typeof map.setZoomLevel === 'function') {
        console.log(`🔍 GeoJump DEBUG: Using setCenter/setZoomLevel on map ${index}`);
        map.setCenter(coordinates.lat, coordinates.lon);
        map.setZoomLevel(coordinates.zoom || options.zoomLevel || 10);
        console.log(`🔍 GeoJump DEBUG: Successfully jumped on map ${index}!`);
        success = true;
      } else if (map._leafletMap && typeof map._leafletMap.setView === 'function') {
        console.log(`🔍 GeoJump DEBUG: Using _leafletMap.setView on map ${index}`);
        map._leafletMap.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        console.log(`🔍 GeoJump DEBUG: Successfully jumped on map ${index}!`);
        success = true;
      } else {
        console.log(`🔍 GeoJump DEBUG: Map ${index} doesn't have compatible methods`);
        console.log(`🔍 GeoJump DEBUG: Available methods:`, Object.getOwnPropertyNames(map).filter(prop => typeof map[prop] === 'function'));
      }
    } catch (error) {
      console.error(`🔍 GeoJump DEBUG: Error jumping on map ${index}:`, error);
    }
  });
  
  return success;
}

/**
 * Debug functions
 */
(window as any).inspectCapturedMaps = function() {
  const maps = getCapturedMaps();
  console.log('🔍 GeoJump DEBUG: Captured maps:', maps.length);
  
  maps.forEach((mapData, index) => {
    const map = mapData.instance;
    console.log(`🔍 GeoJump DEBUG: Map ${index} (${mapData.source}):`, {
      instance: map,
      element: mapData.element,
      options: mapData.options,
      timestamp: new Date(mapData.timestamp).toLocaleString(),
      center: map.getCenter ? map.getCenter() : 'N/A',
      zoom: map.getZoom ? map.getZoom() : 'N/A',
      methods: Object.getOwnPropertyNames(map).filter(prop => typeof map[prop] === 'function').slice(0, 10),
    });
  });
  
  return maps;
};

(window as any).testInterceptorJump = function(lat: number = 40.7128, lon: number = -74.0060, zoom: number = 12) {
  console.log('🔍 GeoJump DEBUG: Testing interceptor jump:', { lat, lon, zoom });
  
  const maps = getCapturedMaps();
  if (maps.length === 0) {
    console.log('🔍 GeoJump DEBUG: No maps captured yet. Try refreshing the page or navigating to a page with a map.');
    return false;
  }
  
  return jumpToCoordinatesWithInterceptor({ lat, lon, zoom });
};
