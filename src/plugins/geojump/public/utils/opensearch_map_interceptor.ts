/**
 * OpenSearch Dashboards Map Interceptor - Hook into the actual map creation process
 */

import { GeojumpCoordinates, GeojumpOptions } from '../../common';

// Global storage
window.__capturedOpenSearchMaps = window.__capturedOpenSearchMaps || [];

export function initializeOpenSearchMapInterceptor(): void {
  console.log('🔍 GeoJump DEBUG: Initializing OpenSearch Dashboards map interceptor');
  
  // Hook into the lazyLoadMapsLegacyModules function
  interceptMapsLegacyModules();
  
  // Hook into BaseMapsVisualization class
  interceptBaseMapsVisualization();
  
  // Set up periodic scanning for existing maps
  setupOpenSearchMapScanning();
}

/**
 * Intercept the lazyLoadMapsLegacyModules function to catch OpenSearchDashboardsMap creation
 */
function interceptMapsLegacyModules(): void {
  // Try to find and intercept the lazyLoadMapsLegacyModules function
  const checkForLazyLoader = () => {
    const win = window as any;
    
    // Look for the function in various locations
    const possibleLocations = [
      win.lazyLoadMapsLegacyModules,
      win.__osdAppPlugins?.mapsLegacy?.lazyLoadMapsLegacyModules,
      win.mapsLegacy?.lazyLoadMapsLegacyModules,
    ];
    
    for (const lazyLoader of possibleLocations) {
      if (lazyLoader && typeof lazyLoader === 'function') {
        console.log('🔍 GeoJump DEBUG: Found lazyLoadMapsLegacyModules, setting up interceptor');
        interceptLazyLoader(lazyLoader);
        return;
      }
    }
    
    setTimeout(checkForLazyLoader, 200);
  };
  
  checkForLazyLoader();
}

/**
 * Intercept the lazy loader to catch module loading
 */
function interceptLazyLoader(originalLazyLoader: Function): void {
  const win = window as any;
  
  // Replace the function
  win.lazyLoadMapsLegacyModules = async function() {
    console.log('🔍 GeoJump DEBUG: Intercepted lazyLoadMapsLegacyModules call');
    
    // Call the original function
    const modules = await originalLazyLoader();
    
    console.log('🔍 GeoJump DEBUG: Loaded maps legacy modules:', modules);
    
    // Intercept the OpenSearchDashboardsMap constructor
    if (modules.OpenSearchDashboardsMap) {
      console.log('🔍 GeoJump DEBUG: Found OpenSearchDashboardsMap in modules, intercepting constructor');
      interceptOpenSearchDashboardsMapConstructor(modules.OpenSearchDashboardsMap);
    }
    
    return modules;
  };
}

/**
 * Intercept the OpenSearchDashboardsMap constructor
 */
function interceptOpenSearchDashboardsMapConstructor(OriginalOpenSearchDashboardsMap: any): void {
  if ((window as any).__originalOpenSearchDashboardsMap) {
    return; // Already intercepted
  }
  
  console.log('🔍 GeoJump DEBUG: Setting up OpenSearchDashboardsMap constructor interceptor');
  
  // Store original constructor
  (window as any).__originalOpenSearchDashboardsMap = OriginalOpenSearchDashboardsMap;
  
  // Create intercepted constructor
  function InterceptedOpenSearchDashboardsMap(containerNode: any, options: any) {
    console.log('🔍 GeoJump DEBUG: Intercepted OpenSearchDashboardsMap constructor');
    console.log('🔍 GeoJump DEBUG: Container:', containerNode);
    console.log('🔍 GeoJump DEBUG: Options:', options);
    
    // Call original constructor
    const instance = new (window as any).__originalOpenSearchDashboardsMap(containerNode, options);
    
    console.log('🔍 GeoJump DEBUG: Created OpenSearchDashboardsMap instance:', instance);
    
    // Capture the map instance
    captureOpenSearchMap(instance, containerNode, options);
    
    return instance;
  }
  
  // Copy prototype and static properties
  InterceptedOpenSearchDashboardsMap.prototype = OriginalOpenSearchDashboardsMap.prototype;
  Object.setPrototypeOf(InterceptedOpenSearchDashboardsMap, OriginalOpenSearchDashboardsMap);
  Object.assign(InterceptedOpenSearchDashboardsMap, OriginalOpenSearchDashboardsMap);
  
  // Replace in the modules object
  const modules = (window as any).mapsLegacyModules;
  if (modules) {
    modules.OpenSearchDashboardsMap = InterceptedOpenSearchDashboardsMap;
  }
}

/**
 * Intercept BaseMapsVisualization class to catch _opensearchDashboardsMap assignment
 */
function interceptBaseMapsVisualization(): void {
  // This is trickier since the class might already be loaded
  // We'll use a different approach - scan for existing instances
  console.log('🔍 GeoJump DEBUG: Setting up BaseMapsVisualization scanning');
}

/**
 * Set up periodic scanning for OpenSearch Dashboards maps
 */
function setupOpenSearchMapScanning(): void {
  console.log('🔍 GeoJump DEBUG: Setting up OpenSearch map scanning');
  
  setInterval(() => {
    // Look for visualization elements that might contain OpenSearch maps
    const visElements = document.querySelectorAll('.visualization, .visWrapper, .embPanel');
    
    visElements.forEach((element) => {
      scanElementForOpenSearchMap(element as HTMLElement);
    });
  }, 1000); // Scan every second
}

/**
 * Scan an element for OpenSearch Dashboards map instances
 */
function scanElementForOpenSearchMap(element: HTMLElement): void {
  // Try to access React component instances
  const reactProps = [
    '__reactInternalInstance$3cyekfou8qi',
    '__reactInternalInstance',
    '__reactFiber$3cyekfou8qi',
    '__reactFiber',
  ];
  
  for (const prop of reactProps) {
    const reactInstance = (element as any)[prop];
    if (reactInstance) {
      searchReactTreeForOpenSearchMap(reactInstance, element);
    }
  }
}

/**
 * Search React component tree for OpenSearch map instances
 */
function searchReactTreeForOpenSearchMap(instance: any, element: HTMLElement, depth = 0): void {
  if (depth > 10) return; // Prevent infinite recursion
  
  try {
    // Check stateNode for visualization instances
    if (instance.stateNode) {
      const stateNode = instance.stateNode;
      
      // Look for _opensearchDashboardsMap property
      if (stateNode._opensearchDashboardsMap) {
        const existing = (window as any).__capturedOpenSearchMaps.find(m => m.instance === stateNode._opensearchDashboardsMap);
        if (!existing) {
          console.log('🔍 GeoJump DEBUG: Found _opensearchDashboardsMap in React stateNode:', stateNode._opensearchDashboardsMap);
          captureOpenSearchMap(stateNode._opensearchDashboardsMap, element, {});
        }
      }
      
      // Also check for other map-related properties
      const mapProps = ['map', '_map', 'opensearchDashboardsMap', 'mapInstance'];
      for (const mapProp of mapProps) {
        if (stateNode[mapProp] && typeof stateNode[mapProp] === 'object') {
          const mapObj = stateNode[mapProp];
          if (mapObj._leafletMap || (typeof mapObj.setCenter === 'function' && typeof mapObj.setZoomLevel === 'function')) {
            const existing = (window as any).__capturedOpenSearchMaps.find(m => m.instance === mapObj);
            if (!existing) {
              console.log(`🔍 GeoJump DEBUG: Found OpenSearch map in React stateNode.${mapProp}:`, mapObj);
              captureOpenSearchMap(mapObj, element, {});
            }
          }
        }
      }
    }
    
    // Search children
    if (instance.child) {
      searchReactTreeForOpenSearchMap(instance.child, element, depth + 1);
    }
    
    // Search siblings
    if (instance.sibling) {
      searchReactTreeForOpenSearchMap(instance.sibling, element, depth + 1);
    }
    
  } catch (error) {
    // Continue searching
  }
}

/**
 * Capture an OpenSearch Dashboards map instance
 */
function captureOpenSearchMap(mapInstance: any, element: any, options: any): void {
  (window as any).__capturedOpenSearchMaps.push({
    instance: mapInstance,
    element: element,
    options: options,
    timestamp: Date.now(),
    leafletMap: mapInstance._leafletMap || null,
  });
  
  console.log(`🔍 GeoJump DEBUG: Captured OpenSearch map. Total: ${(window as any).__capturedOpenSearchMaps.length}`);
  console.log('🔍 GeoJump DEBUG: Map instance methods:', Object.getOwnPropertyNames(mapInstance).filter(prop => typeof mapInstance[prop] === 'function'));
  
  // If it has a Leaflet map, capture that too
  if (mapInstance._leafletMap) {
    console.log('🔍 GeoJump DEBUG: Also found underlying Leaflet map:', mapInstance._leafletMap);
  }
}

/**
 * Jump to coordinates using captured OpenSearch maps
 */
export function jumpWithOpenSearchMaps(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
  const maps = (window as any).__capturedOpenSearchMaps || [];
  console.log(`🔍 GeoJump DEBUG: Jumping with ${maps.length} captured OpenSearch maps`);
  
  if (maps.length === 0) return false;
  
  let success = false;
  
  maps.forEach((mapData, index) => {
    const map = mapData.instance;
    console.log(`🔍 GeoJump DEBUG: Trying OpenSearch map ${index}:`, map);
    
    try {
      // Try OpenSearch Dashboards map methods
      if (typeof map.setCenter === 'function' && typeof map.setZoomLevel === 'function') {
        console.log(`🔍 GeoJump DEBUG: Using OpenSearch map methods on map ${index}`);
        map.setCenter(coordinates.lat, coordinates.lon);
        map.setZoomLevel(coordinates.zoom || options.zoomLevel || 10);
        console.log(`🔍 GeoJump DEBUG: SUCCESS with OpenSearch methods on map ${index}!`);
        success = true;
      }
      // Try underlying Leaflet map
      else if (map._leafletMap && typeof map._leafletMap.setView === 'function') {
        console.log(`🔍 GeoJump DEBUG: Using underlying Leaflet map on map ${index}`);
        map._leafletMap.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        console.log(`🔍 GeoJump DEBUG: SUCCESS with Leaflet methods on map ${index}!`);
        success = true;
      }
      // Try direct Leaflet methods if this is a Leaflet map
      else if (typeof map.setView === 'function') {
        console.log(`🔍 GeoJump DEBUG: Using direct Leaflet methods on map ${index}`);
        map.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        console.log(`🔍 GeoJump DEBUG: SUCCESS with direct Leaflet methods on map ${index}!`);
        success = true;
      }
    } catch (error) {
      console.error(`🔍 GeoJump DEBUG: Error on OpenSearch map ${index}:`, error);
    }
  });
  
  return success;
}

// Debug functions
(window as any).inspectOpenSearchMaps = () => {
  const maps = (window as any).__capturedOpenSearchMaps || [];
  console.log(`🔍 GeoJump DEBUG: ${maps.length} captured OpenSearch maps:`);
  maps.forEach((m, i) => {
    console.log(`  ${i}: OpenSearch map created at ${new Date(m.timestamp).toLocaleTimeString()}`);
    console.log(`      Methods:`, Object.getOwnPropertyNames(m.instance).filter(prop => typeof m.instance[prop] === 'function').slice(0, 5));
    console.log(`      Has Leaflet map:`, !!m.leafletMap);
  });
  return maps;
};

(window as any).testOpenSearchJump = (lat = 40.7128, lon = -74.0060, zoom = 12) => {
  return jumpWithOpenSearchMaps({ lat, lon, zoom });
};
