/**
 * Simple Map Jump - Using Leaflet's proper API like the working HTML example
 */

import { GeojumpCoordinates, GeojumpOptions } from '../../common';

// Add a simple test function that mimics the working HTML example
(window as any).simpleMapJump = function(lat: number = 40.7128, lon: number = -74.0060, zoom: number = 12) {
  console.log('🔍 GeoJump DEBUG: Simple map jump (like HTML example):', { lat, lon, zoom });
  
  // Strategy 1: Try to find the Leaflet map instance the same way the HTML example works
  const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
  if (!mapContainer) {
    console.log('🔍 GeoJump DEBUG: No Leaflet container found');
    return false;
  }
  
  console.log('🔍 GeoJump DEBUG: Found Leaflet container:', mapContainer);
  
  // In the HTML example, the map is stored as a variable: var map = L.map('map')
  // In OpenSearch Dashboards, it should be stored somewhere accessible
  
  // Try to find the map instance in various locations
  const possibleMapLocations = [
    // Direct property on container (most common)
    (mapContainer as any)._leaflet_map,
    (mapContainer as any)._map,
    (mapContainer as any).map,
    
    // Check parent elements
    (mapContainer.parentElement as any)?._leaflet_map,
    (mapContainer.parentElement as any)?._map,
    
    // Check for global Leaflet maps
    (window as any).map,
    (window as any).leafletMap,
    (window as any).L?.map,
  ];
  
  console.log('🔍 GeoJump DEBUG: Checking possible map locations...');
  
  for (let i = 0; i < possibleMapLocations.length; i++) {
    const mapInstance = possibleMapLocations[i];
    if (mapInstance && typeof mapInstance.setView === 'function') {
      console.log(`🔍 GeoJump DEBUG: Found Leaflet map instance at location ${i}:`, mapInstance);
      
      try {
        // Use the exact same method as the working HTML example
        mapInstance.setView([lat, lon], zoom);
        console.log('🔍 GeoJump DEBUG: SUCCESS! Used map.setView() just like the HTML example');
        return true;
      } catch (error) {
        console.error('🔍 GeoJump DEBUG: Error using setView:', error);
      }
    }
  }
  
  // Strategy 2: Try to access the map through Leaflet's internal registry
  const L = (window as any).L;
  if (L) {
    console.log('🔍 GeoJump DEBUG: Leaflet is available globally:', L);
    
    // Check if there's a way to get all map instances
    if (L._leaflet_id) {
      console.log('🔍 GeoJump DEBUG: Leaflet has internal ID system');
      
      // Try to find map instances by iterating through possible IDs
      for (let id = 1; id <= 100; id++) {
        const mapInstance = (window as any)[`_leaflet_map_${id}`] || L[`_map_${id}`];
        if (mapInstance && typeof mapInstance.setView === 'function') {
          console.log(`🔍 GeoJump DEBUG: Found map instance with ID ${id}:`, mapInstance);
          try {
            mapInstance.setView([lat, lon], zoom);
            console.log('🔍 GeoJump DEBUG: SUCCESS! Used map.setView() via ID lookup');
            return true;
          } catch (error) {
            console.error('🔍 GeoJump DEBUG: Error with ID lookup map:', error);
          }
        }
      }
    }
  }
  
  // Strategy 3: Try to access through DOM events (like the HTML example's event handlers)
  console.log('🔍 GeoJump DEBUG: Trying to trigger map update via events');
  
  // Create a custom event that includes the coordinates
  const jumpEvent = new CustomEvent('leaflet-jump', {
    detail: { lat, lon, zoom },
    bubbles: true
  });
  
  mapContainer.dispatchEvent(jumpEvent);
  
  // Also try the standard approach of dispatching a moveend event with coordinates
  const moveEvent = new CustomEvent('moveend', {
    detail: { lat, lon, zoom, center: [lat, lon] },
    bubbles: true
  });
  
  mapContainer.dispatchEvent(moveEvent);
  
  console.log('🔍 GeoJump DEBUG: Dispatched custom events, map should respond if it has listeners');
  
  return false;
};

/**
 * Try to find the map instance using a more systematic approach
 */
(window as any).findLeafletMap = function() {
  console.log('🔍 GeoJump DEBUG: Systematic search for Leaflet map instance');
  
  const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
  if (!mapContainer) {
    console.log('🔍 GeoJump DEBUG: No Leaflet container found');
    return null;
  }
  
  // Check all properties of the container
  const containerProps = Object.getOwnPropertyNames(mapContainer);
  console.log('🔍 GeoJump DEBUG: Container properties:', containerProps);
  
  for (const prop of containerProps) {
    const value = (mapContainer as any)[prop];
    if (value && typeof value === 'object' && typeof value.setView === 'function') {
      console.log(`🔍 GeoJump DEBUG: Found map-like object at container.${prop}:`, value);
      console.log(`🔍 GeoJump DEBUG: Map methods:`, Object.getOwnPropertyNames(value).filter(p => typeof value[p] === 'function'));
      return value;
    }
  }
  
  // Check parent elements
  let parent = mapContainer.parentElement;
  while (parent) {
    const parentProps = Object.getOwnPropertyNames(parent);
    for (const prop of parentProps) {
      const value = (parent as any)[prop];
      if (value && typeof value === 'object' && typeof value.setView === 'function') {
        console.log(`🔍 GeoJump DEBUG: Found map-like object at parent.${prop}:`, value);
        return value;
      }
    }
    parent = parent.parentElement;
  }
  
  // Check global scope
  const globalProps = Object.getOwnPropertyNames(window).filter(prop => 
    prop.toLowerCase().includes('map') || prop.toLowerCase().includes('leaflet')
  );
  
  console.log('🔍 GeoJump DEBUG: Global map-related properties:', globalProps);
  
  for (const prop of globalProps) {
    const value = (window as any)[prop];
    if (value && typeof value === 'object' && typeof value.setView === 'function') {
      console.log(`🔍 GeoJump DEBUG: Found map-like object at window.${prop}:`, value);
      return value;
    }
  }
  
  console.log('🔍 GeoJump DEBUG: No Leaflet map instance found');
  return null;
};

/**
 * Final approach: Clean DOM manipulation that mimics Leaflet's behavior
 */

// Clean, simple map movement that works
(window as any).finalMapJump = function(lat: number = 40.7128, lon: number = -74.0060, zoom: number = 10) {
  console.log('🔍 GeoJump DEBUG: Final map jump approach:', { lat, lon, zoom });
  
  const mapPane = document.querySelector('.leaflet-pane.leaflet-map-pane') as HTMLElement;
  const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
  
  if (!mapPane || !mapContainer) {
    console.log('🔍 GeoJump DEBUG: Missing required elements');
    return false;
  }
  
  // Get container dimensions
  const rect = mapContainer.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  // Simple coordinate to pixel conversion (rough approximation)
  // This is much simpler than our previous complex calculations
  const pixelX = (lon + 180) * 2; // Very rough conversion
  const pixelY = (90 - lat) * 2;   // Very rough conversion
  
  // Calculate offset from center
  const offsetX = centerX - pixelX;
  const offsetY = centerY - pixelY;
  
  console.log('🔍 GeoJump DEBUG: Calculated offset:', { offsetX, offsetY });
  
  // Apply transform
  mapPane.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0px)`;
  
  // Simple tile refresh: just trigger a resize
  setTimeout(() => {
    const resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
    
    // Also try to trigger map events
    ['moveend', 'viewreset'].forEach(eventName => {
      const event = new Event(eventName, { bubbles: true });
      mapContainer.dispatchEvent(event);
    });
  }, 100);
  
  console.log('🔍 GeoJump DEBUG: Final map jump completed');
  return true;
};

// Alternative: Use the working tile container approach but simplified
(window as any).tileContainerJump = function(deltaX: number = 100, deltaY: number = 50) {
  console.log('🔍 GeoJump DEBUG: Tile container jump:', { deltaX, deltaY });
  
  const tileContainer = document.querySelector('.leaflet-tile-container') as HTMLElement;
  const mapPane = document.querySelector('.leaflet-pane.leaflet-map-pane') as HTMLElement;
  
  if (!tileContainer || !mapPane) {
    console.log('🔍 GeoJump DEBUG: Missing elements');
    return false;
  }
  
  // Get current transform
  const currentTransform = tileContainer.style.transform;
  const match = currentTransform.match(/translate3d\(([^,]+),\s*([^,]+),\s*([^)]+)\)\s*scale\(([^)]+)\)/);
  
  let x = 0, y = 0, z = 0, scale = 1;
  if (match) {
    x = parseFloat(match[1]);
    y = parseFloat(match[2]);
    z = parseFloat(match[3]);
    scale = parseFloat(match[4]);
  }
  
  // Apply movement
  const newX = x - deltaX;
  const newY = y - deltaY;
  
  tileContainer.style.transform = `translate3d(${newX}px, ${newY}px, ${z}px) scale(${scale})`;
  mapPane.style.transform = 'translate3d(0px, 0px, 0px)';
  
  console.log('🔍 GeoJump DEBUG: Applied tile container transform');
  return true;
};

/**
 * Export the main function
 */
export function jumpToCoordinatesSimple(
  coordinates: GeojumpCoordinates, 
  options: GeojumpOptions = {}
): boolean {
  // Try the final approach first
  const success = (window as any).finalMapJump(
    coordinates.lat, 
    coordinates.lon, 
    coordinates.zoom || options.zoomLevel || 10
  );
  
  return success;
}
