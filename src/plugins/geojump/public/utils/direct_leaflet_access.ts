import { GeojumpCoordinates, GeojumpOptions } from '../../common';

/**
 * Try to directly access and manipulate Leaflet maps in OpenSearch Dashboards
 */
export function tryDirectLeafletAccess(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
  console.log('🔍 GeoJump DEBUG: Trying direct Leaflet access');
  
  // Find all Leaflet containers
  const leafletContainers = document.querySelectorAll('.leaflet-container');
  console.log('🔍 GeoJump DEBUG: Found', leafletContainers.length, 'Leaflet containers');
  
  if (leafletContainers.length === 0) {
    return false;
  }
  
  // Try each container
  let success = false;
  
  leafletContainers.forEach((container) => {
    const leafletContainer = container as HTMLElement;
    console.log('🔍 GeoJump DEBUG: Processing Leaflet container:', leafletContainer);
    
    // Try to find the Leaflet map instance
    const leafletMap = findLeafletMapInstance(leafletContainer);
    
    if (leafletMap) {
      console.log('🔍 GeoJump DEBUG: Found Leaflet map instance:', leafletMap);
      
      // Try to use the map instance
      if (typeof leafletMap.setView === 'function') {
        console.log('🔍 GeoJump DEBUG: Using Leaflet setView method with coordinates:', [coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        leafletMap.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        success = true;
      } else if (typeof leafletMap.flyTo === 'function') {
        console.log('🔍 GeoJump DEBUG: Using Leaflet flyTo method');
        leafletMap.flyTo([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        success = true;
      } else if (typeof leafletMap.panTo === 'function') {
        console.log('🔍 GeoJump DEBUG: Using Leaflet panTo method');
        leafletMap.panTo([coordinates.lat, coordinates.lon]);
        
        // Try to set zoom separately
        if (typeof leafletMap.setZoom === 'function') {
          leafletMap.setZoom(coordinates.zoom || options.zoomLevel || 10);
        }
        
        success = true;
      }
    }
  });
  
  return success;
}

/**
 * Find a Leaflet map instance in a container
 */
function findLeafletMapInstance(container: HTMLElement): any {
  console.log('🔍 GeoJump DEBUG: Finding Leaflet map instance in container:', container);
  
  // Direct access to _leaflet_map property
  if ((container as any)._leaflet_map) {
    console.log('🔍 GeoJump DEBUG: Found _leaflet_map property:', (container as any)._leaflet_map);
    return (container as any)._leaflet_map;
  }
  
  // Try to find the map instance in the container's children
  const mapPanes = container.querySelectorAll('.leaflet-map-pane');
  if (mapPanes.length > 0) {
    console.log('🔍 GeoJump DEBUG: Found leaflet-map-pane elements:', mapPanes);
    
    // Try to find the map instance in the parent chain
    let element: any = mapPanes[0];
    while (element) {
      if (element._leaflet_map) {
        console.log('🔍 GeoJump DEBUG: Found _leaflet_map in parent chain:', element._leaflet_map);
        return element._leaflet_map;
      }
      element = element.parentElement;
    }
  }
  
  // Last resort: try to find any Leaflet map in the DOM
  const allElements = document.querySelectorAll('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i] as any;
    if (el._leaflet_map) {
      console.log('🔍 GeoJump DEBUG: Found _leaflet_map in DOM element:', el, el._leaflet_map);
      return el._leaflet_map;
    }
  }
  
  return null;
}
