import { GeojumpCoordinates, GeojumpOptions } from '../../common';

window.__capturedLeafletMaps = window.__capturedLeafletMaps || [];

export function initializeEnhancedInterceptor(): void {
  console.log('🔍 GeoJump DEBUG: Setting up enhanced interceptor');
  
  setupLeafletInterceptor();
  setupDOMObserver();
  setupPeriodicScan();
}

function setupLeafletInterceptor(): void {
  const checkLeaflet = () => {
    const L = (window as any).L;
    if (L && L.map && !(window as any).__originalLeafletMap) {
      console.log('🔍 GeoJump DEBUG: Setting up Leaflet interceptor');
      
      (window as any).__originalLeafletMap = L.map;
      
      L.map = function(element: any, options: any = {}) {
        console.log('🔍 GeoJump DEBUG: Intercepted L.map() call');
        const mapInstance = (window as any).__originalLeafletMap.call(this, element, options);
        
        console.log('🔍 GeoJump DEBUG: Captured map via L.map():', mapInstance);
        captureMap(mapInstance, element, 'L.map');
        
        return mapInstance;
      };
      
      Object.setPrototypeOf(L.map, (window as any).__originalLeafletMap);
      Object.assign(L.map, (window as any).__originalLeafletMap);
    } else {
      setTimeout(checkLeaflet, 100);
    }
  };
  
  checkLeaflet();
}

function setupDOMObserver(): void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          
          if (element.classList?.contains('leaflet-container')) {
            setTimeout(() => scanForMapInElement(element), 200);
          }
          
          const containers = element.querySelectorAll?.('.leaflet-container');
          containers?.forEach((container) => {
            setTimeout(() => scanForMapInElement(container as HTMLElement), 200);
          });
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

function setupPeriodicScan(): void {
  setInterval(() => {
    const containers = document.querySelectorAll('.leaflet-container');
    containers.forEach((container) => {
      scanForMapInElement(container as HTMLElement);
    });
  }, 2000);
}

function scanForMapInElement(element: HTMLElement): void {
  const possibleProps = ['_leaflet_map', '_map', 'map', 'mapInstance', '__leafletMapInstance'];
  
  for (const prop of possibleProps) {
    const mapInstance = (element as any)[prop];
    if (mapInstance && typeof mapInstance.setView === 'function') {
      const existing = window.__capturedLeafletMaps.find(m => m.instance === mapInstance);
      if (!existing) {
        console.log(`🔍 GeoJump DEBUG: Found new map via ${prop}:`, mapInstance);
        captureMap(mapInstance, element, `DOM.${prop}`);
      }
      return;
    }
  }
}

function captureMap(mapInstance: any, element: any, source: string): void {
  window.__capturedLeafletMaps.push({
    instance: mapInstance,
    element: element,
    source: source,
    timestamp: Date.now()
  });
  
  console.log(`🔍 GeoJump DEBUG: Captured map from ${source}. Total: ${window.__capturedLeafletMaps.length}`);
  
  if (element && element.nodeType) {
    (element as any).__leafletMapInstance = mapInstance;
  }
}

export function jumpWithEnhancedInterceptor(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
  const maps = window.__capturedLeafletMaps || [];
  console.log(`🔍 GeoJump DEBUG: Jumping with ${maps.length} captured maps`);
  
  if (maps.length === 0) return false;
  
  let success = false;
  
  maps.forEach((mapData, index) => {
    const map = mapData.instance;
    console.log(`🔍 GeoJump DEBUG: Trying map ${index} (${mapData.source})`);
    
    try {
      if (typeof map.setView === 'function') {
        map.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        console.log(`🔍 GeoJump DEBUG: SUCCESS on map ${index}!`);
        success = true;
      }
    } catch (error) {
      console.error(`🔍 GeoJump DEBUG: Error on map ${index}:`, error);
    }
  });
  
  return success;
}

(window as any).inspectMaps = () => {
  const maps = window.__capturedLeafletMaps || [];
  console.log(`🔍 GeoJump DEBUG: ${maps.length} captured maps:`);
  maps.forEach((m, i) => console.log(`  ${i}: ${m.source} at ${new Date(m.timestamp).toLocaleTimeString()}`));
  return maps;
};

(window as any).testEnhancedJump = (lat = 40.7128, lon = -74.0060, zoom = 12) => {
  return jumpWithEnhancedInterceptor({ lat, lon, zoom });
};
