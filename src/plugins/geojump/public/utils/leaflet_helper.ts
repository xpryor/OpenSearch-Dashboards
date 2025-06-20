/**
 * Find a Leaflet map instance in a container
 */
export function findLeafletMap(container: HTMLElement): any {
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
