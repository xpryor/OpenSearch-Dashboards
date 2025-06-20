import { GeojumpCoordinates, GeojumpOptions } from '../../common';

export function jumpUsingDirectMapAccess(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
  console.log('🔍 GeoJump DEBUG: Using direct OpenSearch Dashboards map access');
  
  const visElements = document.querySelectorAll('.visualization, .visWrapper, .embPanel, [data-test-subj="embeddablePanel"]');
  console.log(`🔍 GeoJump DEBUG: Found ${visElements.length} visualization elements`);
  
  let success = false;
  
  visElements.forEach((element, index) => {
    console.log(`🔍 GeoJump DEBUG: Checking visualization element ${index}`);
    
    const reactProps = ['__reactInternalInstance$3cyekfou8qi', '__reactInternalInstance'];
    
    for (const prop of reactProps) {
      const reactInstance = (element as any)[prop];
      if (reactInstance) {
        const mapInstance = searchReactTreeForOpenSearchMap(reactInstance);
        
        if (mapInstance) {
          console.log('🔍 GeoJump DEBUG: Found OpenSearch Dashboards map instance:', mapInstance);
          
          if (tryJumpWithOpenSearchMap(mapInstance, coordinates, options)) {
            success = true;
            return;
          }
        }
      }
    }
  });
  
  return success;
}

function searchReactTreeForOpenSearchMap(instance: any, depth = 0): any {
  if (depth > 15) return null;
  
  try {
    if (instance.stateNode) {
      const stateNode = instance.stateNode;
      
      if (stateNode._opensearchDashboardsMap) {
        console.log('🔍 GeoJump DEBUG: Found _opensearchDashboardsMap in stateNode');
        return stateNode._opensearchDashboardsMap;
      }
      
      const mapProps = ['opensearchDashboardsMap', 'map', '_map', 'mapInstance'];
      for (const mapProp of mapProps) {
        if (stateNode[mapProp] && typeof stateNode[mapProp] === 'object') {
          const mapObj = stateNode[mapProp];
          if (typeof mapObj.setView === 'function' || 
              (typeof mapObj.setCenter === 'function' && typeof mapObj.setZoomLevel === 'function')) {
            console.log(`🔍 GeoJump DEBUG: Found OpenSearch map in stateNode.${mapProp}`);
            return mapObj;
          }
        }
      }
    }
    
    if (instance.child) {
      const childResult = searchReactTreeForOpenSearchMap(instance.child, depth + 1);
      if (childResult) return childResult;
    }
    
    if (instance.sibling) {
      const siblingResult = searchReactTreeForOpenSearchMap(instance.sibling, depth + 1);
      if (siblingResult) return siblingResult;
    }
    
  } catch (error) {
    // Continue searching
  }
  
  return null;
}

function tryJumpWithOpenSearchMap(mapInstance: any, coordinates: GeojumpCoordinates, options: GeojumpOptions): boolean {
  console.log('🔍 GeoJump DEBUG: Attempting to jump with OpenSearch map instance');
  
  try {
    if (typeof mapInstance.setView === 'function') {
      console.log('🔍 GeoJump DEBUG: Using setView method');
      mapInstance.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
      console.log('🔍 GeoJump DEBUG: SUCCESS with setView!');
      return true;
    }
    
    if (typeof mapInstance.setCenter === 'function' && typeof mapInstance.setZoomLevel === 'function') {
      console.log('🔍 GeoJump DEBUG: Using OpenSearch Dashboards map methods');
      mapInstance.setCenter(coordinates.lat, coordinates.lon);
      mapInstance.setZoomLevel(coordinates.zoom || options.zoomLevel || 10);
      console.log('🔍 GeoJump DEBUG: SUCCESS with OpenSearch Dashboards methods!');
      return true;
    }
    
    if (mapInstance._leafletMap && typeof mapInstance._leafletMap.setView === 'function') {
      console.log('🔍 GeoJump DEBUG: Using underlying _leafletMap');
      mapInstance._leafletMap.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
      console.log('🔍 GeoJump DEBUG: SUCCESS with _leafletMap!');
      return true;
    }
    
  } catch (error) {
    console.error('🔍 GeoJump DEBUG: Error jumping with OpenSearch map:', error);
  }
  
  return false;
}

(window as any).testDirectMapAccess = (lat = 40.7128, lon = -74.0060, zoom = 12) => {
  return jumpUsingDirectMapAccess({ lat, lon, zoom });
};

(window as any).debugReactProperties = () => {
  const visElements = document.querySelectorAll('.visualization, .visWrapper, .embPanel, [data-test-subj="embeddablePanel"]');
  console.log(`🔍 GeoJump DEBUG: Found ${visElements.length} visualization elements`);
  
  visElements.forEach((element, index) => {
    console.log(`🔍 GeoJump DEBUG: Element ${index}:`, element);
    console.log(`🔍 GeoJump DEBUG: Element ${index} classes:`, element.className);
    
    // Check all properties that start with __react
    const allProps = Object.getOwnPropertyNames(element);
    const reactProps = allProps.filter(prop => prop.includes('react') || prop.includes('React'));
    console.log(`🔍 GeoJump DEBUG: Element ${index} React properties:`, reactProps);
    
    // Try each React property
    reactProps.forEach(prop => {
      const reactInstance = (element as any)[prop];
      if (reactInstance) {
        console.log(`🔍 GeoJump DEBUG: Element ${index} ${prop}:`, reactInstance);
        
        // Check if stateNode exists
        if (reactInstance.stateNode) {
          console.log(`🔍 GeoJump DEBUG: Element ${index} ${prop}.stateNode:`, reactInstance.stateNode);
          console.log(`🔍 GeoJump DEBUG: Element ${index} stateNode properties:`, Object.getOwnPropertyNames(reactInstance.stateNode));
          
          // Check for _opensearchDashboardsMap specifically
          if (reactInstance.stateNode._opensearchDashboardsMap) {
            console.log(`🔍 GeoJump DEBUG: FOUND _opensearchDashboardsMap in element ${index}!`, reactInstance.stateNode._opensearchDashboardsMap);
          }
        }
      }
    });
  });
};
