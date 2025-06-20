/**
 * OpenSearch Dashboards Map Access Utility
 * 
 * This utility leverages the internal OpenSearch Dashboards map infrastructure
 * to access and manipulate maps properly, instead of trying to hack into Leaflet directly.
 */

import { GeojumpCoordinates, GeojumpOptions } from '../../common';

// Add a function to the global scope for testing
(window as any).opensearchMapJump = function(lat: number = 40.7128, lon: number = -74.0060, zoom: number = 12) {
  console.log('🔍 GeoJump DEBUG: OpenSearch map jump with coordinates:', lat, lon, zoom);
  
  // Strategy 1: Find the specific map embeddable panel
  const mapPanel = document.querySelector('[data-test-subj="embeddablePanel"]') as HTMLElement;
  if (mapPanel) {
    console.log('🔍 GeoJump DEBUG: Found map panel:', mapPanel);
    console.log('🔍 GeoJump DEBUG: Map panel embeddable ID:', mapPanel.getAttribute('data-test-embeddable-id'));
    
    // Try to find React instances with different property names
    const possibleReactProps = [
      '__reactInternalInstance$3cyekfou8qi',
      '__reactInternalInstance',
      '__reactFiber$3cyekfou8qi', 
      '__reactFiber',
      '_reactInternalFiber',
      '_reactInternalInstance'
    ];
    
    let reactInstance = null;
    for (const prop of possibleReactProps) {
      if ((mapPanel as any)[prop]) {
        reactInstance = (mapPanel as any)[prop];
        console.log(`🔍 GeoJump DEBUG: Found React instance via ${prop}:`, reactInstance);
        break;
      }
    }
    
    if (reactInstance) {
      // Deep search through React component tree
      const searchForMapDeep = (instance: any, depth = 0, path = ''): any => {
        if (depth > 15) return null; // Increased depth limit
        
        try {
          const currentPath = path ? `${path}.${depth}` : `${depth}`;
          
          // Check all possible map-related properties
          const mapProps = [
            'opensearchDashboardsMap', 'map', '_map', 'visMap', 'leafletMap', 
            'mapInstance', '_mapInstance', 'tileMap', 'regionMap', 'geoMap',
            'visualization', 'vis', '_vis', 'embeddable', '_embeddable'
          ];
          
          // Check memoizedProps
          if (instance.memoizedProps) {
            console.log(`🔍 GeoJump DEBUG: Checking memoizedProps at ${currentPath}`);
            for (const prop of mapProps) {
              if (instance.memoizedProps[prop]) {
                const obj = instance.memoizedProps[prop];
                console.log(`🔍 GeoJump DEBUG: Found ${prop} in memoizedProps:`, obj);
                
                // Check if this is an OpenSearch Dashboards map
                if (obj._leafletMap || (typeof obj.setCenter === 'function' && typeof obj.setZoomLevel === 'function')) {
                  console.log(`🔍 GeoJump DEBUG: Found OpenSearch map at memoizedProps.${prop}`);
                  return obj;
                }
                
                // Check nested properties
                if (typeof obj === 'object' && obj !== null) {
                  for (const nestedProp of mapProps) {
                    if (obj[nestedProp] && (obj[nestedProp]._leafletMap || typeof obj[nestedProp].setCenter === 'function')) {
                      console.log(`🔍 GeoJump DEBUG: Found nested map at memoizedProps.${prop}.${nestedProp}`);
                      return obj[nestedProp];
                    }
                  }
                }
              }
            }
          }
          
          // Check stateNode
          if (instance.stateNode) {
            console.log(`🔍 GeoJump DEBUG: Checking stateNode at ${currentPath}`);
            for (const prop of mapProps) {
              if (instance.stateNode[prop]) {
                const obj = instance.stateNode[prop];
                console.log(`🔍 GeoJump DEBUG: Found ${prop} in stateNode:`, obj);
                
                if (obj._leafletMap || (typeof obj.setCenter === 'function' && typeof obj.setZoomLevel === 'function')) {
                  console.log(`🔍 GeoJump DEBUG: Found OpenSearch map at stateNode.${prop}`);
                  return obj;
                }
                
                // Check nested properties
                if (typeof obj === 'object' && obj !== null) {
                  for (const nestedProp of mapProps) {
                    if (obj[nestedProp] && (obj[nestedProp]._leafletMap || typeof obj[nestedProp].setCenter === 'function')) {
                      console.log(`🔍 GeoJump DEBUG: Found nested map at stateNode.${prop}.${nestedProp}`);
                      return obj[nestedProp];
                    }
                  }
                }
              }
            }
          }
          
          // Check memoizedState
          if (instance.memoizedState) {
            console.log(`🔍 GeoJump DEBUG: Checking memoizedState at ${currentPath}`);
            for (const prop of mapProps) {
              if (instance.memoizedState[prop]) {
                const obj = instance.memoizedState[prop];
                console.log(`🔍 GeoJump DEBUG: Found ${prop} in memoizedState:`, obj);
                
                if (obj._leafletMap || (typeof obj.setCenter === 'function' && typeof obj.setZoomLevel === 'function')) {
                  console.log(`🔍 GeoJump DEBUG: Found OpenSearch map at memoizedState.${prop}`);
                  return obj;
                }
              }
            }
          }
          
          // Search children
          if (instance.child) {
            const childResult = searchForMapDeep(instance.child, depth + 1, `${currentPath}.child`);
            if (childResult) return childResult;
          }
          
          // Search siblings
          if (instance.sibling) {
            const siblingResult = searchForMapDeep(instance.sibling, depth + 1, `${currentPath}.sibling`);
            if (siblingResult) return siblingResult;
          }
          
          // Search return (for newer React versions)
          if (instance.return) {
            const returnResult = searchForMapDeep(instance.return, depth + 1, `${currentPath}.return`);
            if (returnResult) return returnResult;
          }
          
        } catch (error) {
          console.debug(`🔍 GeoJump DEBUG: Error searching at ${currentPath}:`, error);
        }
        
        return null;
      };
      
      const foundMap = searchForMapDeep(reactInstance);
      if (foundMap) {
        console.log('🔍 GeoJump DEBUG: Found OpenSearch map instance:', foundMap);
        return tryUseOpenSearchMap(foundMap, lat, lon, zoom);
      }
    }
    
    // Strategy 2: Search all child elements of the map panel
    console.log('🔍 GeoJump DEBUG: Searching all child elements of map panel');
    const allChildren = mapPanel.querySelectorAll('*');
    console.log(`🔍 GeoJump DEBUG: Found ${allChildren.length} child elements`);
    
    for (let i = 0; i < allChildren.length; i++) {
      const child = allChildren[i] as any;
      
      // Check for React instances on child elements
      for (const prop of possibleReactProps) {
        if (child[prop]) {
          console.log(`🔍 GeoJump DEBUG: Found React instance on child ${i} via ${prop}`);
          const foundMap = searchForMapDeep(child[prop]);
          if (foundMap) {
            console.log('🔍 GeoJump DEBUG: Found map in child element');
            return tryUseOpenSearchMap(foundMap, lat, lon, zoom);
          }
        }
      }
      
      // Check for direct map properties on DOM elements
      const mapProps = ['opensearchDashboardsMap', 'map', '_map', 'visMap', '_leafletMap'];
      for (const prop of mapProps) {
        if (child[prop]) {
          console.log(`🔍 GeoJump DEBUG: Found ${prop} on child element:`, child[prop]);
          if (child[prop]._leafletMap || typeof child[prop].setCenter === 'function') {
            return tryUseOpenSearchMap(child[prop], lat, lon, zoom);
          }
        }
      }
    }
  }
  
  // Strategy 3: Look for the Leaflet container and try to find its parent OpenSearch map
  const leafletContainer = document.querySelector('.leaflet-container') as HTMLElement;
  if (leafletContainer) {
    console.log('🔍 GeoJump DEBUG: Found Leaflet container, searching parent chain for OpenSearch map');
    
    let parent = leafletContainer.parentElement;
    while (parent) {
      // Check for React instances on parent elements
      const possibleReactProps = [
        '__reactInternalInstance$3cyekfou8qi',
        '__reactInternalInstance',
        '__reactFiber$3cyekfou8qi', 
        '__reactFiber'
      ];
      
      for (const prop of possibleReactProps) {
        if ((parent as any)[prop]) {
          console.log(`🔍 GeoJump DEBUG: Found React instance on parent via ${prop}`);
          const foundMap = searchForMapDeep((parent as any)[prop]);
          if (foundMap) {
            console.log('🔍 GeoJump DEBUG: Found map in parent element');
            return tryUseOpenSearchMap(foundMap, lat, lon, zoom);
          }
        }
      }
      
      parent = parent.parentElement;
    }
  }
  
  console.log('🔍 GeoJump DEBUG: All strategies failed');
  return false;
};

function tryUseOpenSearchMap(mapObj: any, lat: number, lon: number, zoom: number): boolean {
  console.log('🔍 GeoJump DEBUG: Trying to use OpenSearch map object:', mapObj);
  console.log('🔍 GeoJump DEBUG: Map object methods:', Object.getOwnPropertyNames(mapObj).filter(prop => typeof mapObj[prop] === 'function'));
  
  // Try OpenSearch Dashboards map methods first
  if (typeof mapObj.setCenter === 'function' && typeof mapObj.setZoomLevel === 'function') {
    console.log('🔍 GeoJump DEBUG: Using OpenSearch Dashboards map methods');
    try {
      mapObj.setCenter(lat, lon);
      mapObj.setZoomLevel(zoom);
      console.log('🔍 GeoJump DEBUG: SUCCESS via OpenSearch Dashboards map methods!');
      return true;
    } catch (error) {
      console.error('🔍 GeoJump DEBUG: Error with OpenSearch map methods:', error);
    }
  }
  
  // Try underlying Leaflet map
  if (mapObj._leafletMap && typeof mapObj._leafletMap.setView === 'function') {
    console.log('🔍 GeoJump DEBUG: Using underlying Leaflet map');
    try {
      mapObj._leafletMap.setView([lat, lon], zoom);
      console.log('🔍 GeoJump DEBUG: SUCCESS via underlying Leaflet map!');
      return true;
    } catch (error) {
      console.error('🔍 GeoJump DEBUG: Error with underlying Leaflet map:', error);
    }
  }
  
  // Try direct Leaflet methods if this is a Leaflet map
  if (typeof mapObj.setView === 'function') {
    console.log('🔍 GeoJump DEBUG: Using direct Leaflet methods');
    try {
      mapObj.setView([lat, lon], zoom);
      console.log('🔍 GeoJump DEBUG: SUCCESS via direct Leaflet methods!');
      return true;
    } catch (error) {
      console.error('🔍 GeoJump DEBUG: Error with direct Leaflet methods:', error);
    }
  }
  
  return false;
}

/**
 * Main function to jump to coordinates using OpenSearch Dashboards map infrastructure
 */
export function jumpToCoordinatesUsingOpenSearchMaps(
  coordinates: GeojumpCoordinates, 
  options: GeojumpOptions = {}
): boolean {
  console.log('🔍 GeoJump DEBUG: Jumping using OpenSearch Dashboards map infrastructure');
  
  // Use the global test function for now
  return (window as any).opensearchMapJump(coordinates.lat, coordinates.lon, coordinates.zoom || options.zoomLevel || 10);
}
