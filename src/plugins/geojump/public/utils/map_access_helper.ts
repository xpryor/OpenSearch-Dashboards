/**
 * Helper functions for accessing maps in OpenSearch Dashboards
 */

// Store references to map instances
(window as any).__geojump_maps = (window as any).__geojump_maps || [];

// Add the ultimate test function that accesses the existing map
(window as any).ultimateGeoJump = function(lat: number = 40.7128, lon: number = -74.0060, zoom: number = 12) {
  console.log('🔍 GeoJump DEBUG: Ultimate test with coordinates:', lat, lon, zoom);
  
  const container = document.querySelector('.leaflet-container') as any;
  if (!container) {
    console.log('🔍 GeoJump DEBUG: No Leaflet container found');
    return false;
  }
  
  const L = (window as any).L;
  if (!L) {
    console.log('🔍 GeoJump DEBUG: No global Leaflet object');
    return false;
  }
  
  console.log('🔍 GeoJump DEBUG: Container _leaflet_id:', container._leaflet_id);
  
  // Since we know the map exists (constructor failed with "already initialized"),
  // we need to find the existing map instance
  
  // Method 1: Try to access the map through Leaflet's internal stamp system
  console.log('🔍 GeoJump DEBUG: Trying Leaflet stamp system');
  
  // In Leaflet, each object gets a unique stamp/ID
  // The map should be accessible through this system
  const leafletId = container._leaflet_id;
  
  // Try to find the map in Leaflet's internal object registry
  // Leaflet uses L.stamp() to assign IDs and stores objects internally
  
  // Method 1a: Check if Leaflet has an internal map registry
  if (L._leaflet_id && leafletId) {
    console.log('🔍 GeoJump DEBUG: Leaflet has internal ID system, searching...');
    
    // Try to access the map through various internal Leaflet properties
    const possibleMapRefs = [
      L[`_leaflet_map_${leafletId}`],
      L[`map_${leafletId}`],
      (window as any)[`_leaflet_map_${leafletId}`],
      (window as any)[`leaflet_map_${leafletId}`],
      (window as any)[`map${leafletId}`]
    ];
    
    for (const mapRef of possibleMapRefs) {
      if (mapRef && typeof mapRef.setView === 'function') {
        console.log('🔍 GeoJump DEBUG: Found map via internal reference:', mapRef);
        try {
          mapRef.setView([lat, lon], zoom);
          console.log('🔍 GeoJump DEBUG: SUCCESS via internal reference!');
          return true;
        } catch (error) {
          console.error('🔍 GeoJump DEBUG: Internal reference error:', error);
        }
      }
    }
  }
  
  // Method 2: Use Leaflet's event system to find the map
  console.log('🔍 GeoJump DEBUG: Trying event system approach');
  
  // Since the container has events, we can try to trigger an event and capture the map
  try {
    let capturedMap = null;
    
    // Create a temporary event handler that will capture the map instance
    const tempHandler = function(e: any) {
      console.log('🔍 GeoJump DEBUG: Event triggered, checking for map:', e);
      if (e.target && typeof e.target.setView === 'function') {
        capturedMap = e.target;
        console.log('🔍 GeoJump DEBUG: Captured map from event:', capturedMap);
      }
    };
    
    // Add the temporary handler
    container.addEventListener('click', tempHandler);
    
    // Trigger a click event
    const clickEvent = new MouseEvent('click', { bubbles: true });
    container.dispatchEvent(clickEvent);
    
    // Remove the temporary handler
    container.removeEventListener('click', tempHandler);
    
    if (capturedMap) {
      try {
        capturedMap.setView([lat, lon], zoom);
        console.log('🔍 GeoJump DEBUG: SUCCESS via event capture!');
        return true;
      } catch (error) {
        console.error('🔍 GeoJump DEBUG: Event capture map error:', error);
      }
    }
  } catch (error) {
    console.error('🔍 GeoJump DEBUG: Event system error:', error);
  }
  
  // Method 3: Try to access the map through the container's prototype chain
  console.log('🔍 GeoJump DEBUG: Trying prototype chain approach');
  
  try {
    // Check if the container has any hidden properties that might contain the map
    const descriptor = Object.getOwnPropertyDescriptor(container, '_leaflet_map');
    if (descriptor) {
      console.log('🔍 GeoJump DEBUG: Found _leaflet_map descriptor:', descriptor);
      if (descriptor.value && typeof descriptor.value.setView === 'function') {
        descriptor.value.setView([lat, lon], zoom);
        console.log('🔍 GeoJump DEBUG: SUCCESS via descriptor!');
        return true;
      }
    }
    
    // Try to access through the prototype
    const proto = Object.getPrototypeOf(container);
    if (proto && proto._leaflet_map && typeof proto._leaflet_map.setView === 'function') {
      console.log('🔍 GeoJump DEBUG: Found map in prototype:', proto._leaflet_map);
      proto._leaflet_map.setView([lat, lon], zoom);
      console.log('🔍 GeoJump DEBUG: SUCCESS via prototype!');
      return true;
    }
  } catch (error) {
    console.error('🔍 GeoJump DEBUG: Prototype chain error:', error);
  }
  
  // Method 4: Try to access the map by temporarily modifying Leaflet
  console.log('🔍 GeoJump DEBUG: Trying Leaflet modification approach');
  
  try {
    // Store the original map constructor
    const originalMap = L.Map;
    let interceptedMap = null;
    
    // Temporarily override the Map constructor to intercept map creation
    L.Map = function(...args: any[]) {
      const map = new originalMap(...args);
      interceptedMap = map;
      console.log('🔍 GeoJump DEBUG: Intercepted map:', map);
      return map;
    };
    
    // Copy over static properties
    Object.setPrototypeOf(L.Map, originalMap);
    Object.assign(L.Map, originalMap);
    
    // Try to trigger something that might access the map
    try {
      // Trigger a resize event which might cause the map to be accessed
      const resizeEvent = new Event('resize');
      container.dispatchEvent(resizeEvent);
      window.dispatchEvent(resizeEvent);
    } catch (e) {
      // Ignore errors
    }
    
    // Restore the original constructor
    L.Map = originalMap;
    
    if (interceptedMap && typeof interceptedMap.setView === 'function') {
      console.log('🔍 GeoJump DEBUG: Using intercepted map:', interceptedMap);
      interceptedMap.setView([lat, lon], zoom);
      console.log('🔍 GeoJump DEBUG: SUCCESS via interception!');
      return true;
    }
  } catch (error) {
    console.error('🔍 GeoJump DEBUG: Interception error:', error);
    // Make sure to restore the original constructor
    try {
      L.Map = originalMap;
    } catch (e) {
      // Ignore
    }
  }
  
  // Method 5: Try to find the map by examining all objects with the same Leaflet ID
  console.log('🔍 GeoJump DEBUG: Trying same-ID object search');
  
  try {
    // Search through all DOM elements for objects with the same Leaflet ID
    const allElements = document.querySelectorAll('*');
    
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i] as any;
      
      // Check if this element has the same Leaflet ID but is not the container
      if (element._leaflet_id === leafletId && element !== container) {
        console.log('🔍 GeoJump DEBUG: Found element with same ID:', element);
        
        // Check if this element has a map
        if (element._leaflet_map && typeof element._leaflet_map.setView === 'function') {
          console.log('🔍 GeoJump DEBUG: Found map in same-ID element:', element._leaflet_map);
          element._leaflet_map.setView([lat, lon], zoom);
          console.log('🔍 GeoJump DEBUG: SUCCESS via same-ID element!');
          return true;
        }
      }
      
      // Also check if any element has a map that might be associated with our container
      if (element._leaflet_map && typeof element._leaflet_map.setView === 'function') {
        // Check if this map's container is our container
        const mapContainer = element._leaflet_map.getContainer && element._leaflet_map.getContainer();
        if (mapContainer === container) {
          console.log('🔍 GeoJump DEBUG: Found map with matching container:', element._leaflet_map);
          element._leaflet_map.setView([lat, lon], zoom);
          console.log('🔍 GeoJump DEBUG: SUCCESS via container match!');
          return true;
        }
      }
    }
  } catch (error) {
    console.error('🔍 GeoJump DEBUG: Same-ID search error:', error);
  }
  
  console.log('🔍 GeoJump DEBUG: All ultimate strategies failed');
  return false;
};
(window as any).simpleGeoJump = function(lat: number = 40.7128, lon: number = -74.0060, zoom: number = 12) {
  console.log('🔍 GeoJump DEBUG: Simple test with coordinates:', lat, lon, zoom);
  
  const container = document.querySelector('.leaflet-container') as any;
  if (!container) {
    console.log('🔍 GeoJump DEBUG: No Leaflet container found');
    return false;
  }
  
  console.log('🔍 GeoJump DEBUG: Container found:', container);
  console.log('🔍 GeoJump DEBUG: Container _leaflet_id:', container._leaflet_id);
  
  const L = (window as any).L;
  if (!L) {
    console.log('🔍 GeoJump DEBUG: No global Leaflet object');
    return false;
  }
  
  console.log('🔍 GeoJump DEBUG: Leaflet version:', L.version);
  
  // Strategy 1: Try to find the map in Leaflet's internal registry
  console.log('🔍 GeoJump DEBUG: Trying Leaflet internal registry');
  
  // Check if Leaflet has a map registry
  const possibleRegistries = [
    L._leaflet_maps,
    L._maps,
    L.maps,
    (window as any)._leaflet_maps,
    (window as any).leafletMaps
  ];
  
  for (const registry of possibleRegistries) {
    if (registry) {
      console.log('🔍 GeoJump DEBUG: Found registry:', registry);
      Object.keys(registry).forEach(key => {
        const map = registry[key];
        if (map && typeof map.setView === 'function') {
          console.log(`🔍 GeoJump DEBUG: Found map in registry[${key}]:`, map);
          try {
            map.setView([lat, lon], zoom);
            console.log('🔍 GeoJump DEBUG: SUCCESS via registry!');
            return true;
          } catch (error) {
            console.error('🔍 GeoJump DEBUG: Registry map error:', error);
          }
        }
      });
    }
  }
  
  // Strategy 2: Try to access the map through the container's parent/child elements
  console.log('🔍 GeoJump DEBUG: Searching parent/child elements');
  
  // Check parent elements
  let parent = container.parentElement;
  while (parent) {
    if ((parent as any)._leaflet_map) {
      console.log('🔍 GeoJump DEBUG: Found map in parent:', (parent as any)._leaflet_map);
      try {
        (parent as any)._leaflet_map.setView([lat, lon], zoom);
        console.log('🔍 GeoJump DEBUG: SUCCESS via parent!');
        return true;
      } catch (error) {
        console.error('🔍 GeoJump DEBUG: Parent map error:', error);
      }
    }
    parent = parent.parentElement;
  }
  
  // Check all elements in the visualization
  const visContainer = container.closest('.visualization') || container.closest('.embPanel');
  if (visContainer) {
    console.log('🔍 GeoJump DEBUG: Searching visualization container:', visContainer);
    
    const allElements = visContainer.querySelectorAll('*');
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i] as any;
      if (element._leaflet_map && typeof element._leaflet_map.setView === 'function') {
        console.log('🔍 GeoJump DEBUG: Found map in visualization element:', element._leaflet_map);
        try {
          element._leaflet_map.setView([lat, lon], zoom);
          console.log('🔍 GeoJump DEBUG: SUCCESS via visualization element!');
          return true;
        } catch (error) {
          console.error('🔍 GeoJump DEBUG: Visualization element map error:', error);
        }
      }
    }
  }
  
  // Strategy 3: Try to use Leaflet's map constructor to access existing map
  console.log('🔍 GeoJump DEBUG: Trying to access existing map via constructor');
  
  try {
    // This is a bit hacky, but try to create a map reference to the existing container
    // Some Leaflet versions allow this
    const existingMap = L.map(container);
    if (existingMap && typeof existingMap.setView === 'function') {
      console.log('🔍 GeoJump DEBUG: Got existing map via constructor:', existingMap);
      try {
        existingMap.setView([lat, lon], zoom);
        console.log('🔍 GeoJump DEBUG: SUCCESS via constructor!');
        return true;
      } catch (error) {
        console.error('🔍 GeoJump DEBUG: Constructor map error:', error);
      }
    }
  } catch (error) {
    console.log('🔍 GeoJump DEBUG: Constructor approach failed:', error.message);
  }
  
  // Strategy 4: Try to trigger map update via DOM manipulation
  console.log('🔍 GeoJump DEBUG: Trying DOM manipulation approach');
  
  try {
    // Dispatch a custom event that might be picked up by the map
    const event = new CustomEvent('leaflet-setview', {
      detail: { lat, lon, zoom },
      bubbles: true
    });
    
    container.dispatchEvent(event);
    
    // Also try to trigger a resize which might cause the map to update
    setTimeout(() => {
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);
    }, 100);
    
    console.log('🔍 GeoJump DEBUG: Dispatched events, check if map moved');
    
  } catch (error) {
    console.error('🔍 GeoJump DEBUG: DOM manipulation error:', error);
  }
  
  console.log('🔍 GeoJump DEBUG: All strategies failed');
  return false;
};
(window as any).testGeoJump = function(lat: number = 40.7128, lon: number = -74.0060, zoom: number = 10) {
  console.log('🔍 GeoJump DEBUG: Testing direct map access with coordinates:', lat, lon, zoom);
  
  const leafletContainers = document.querySelectorAll('.leaflet-container');
  console.log('🔍 GeoJump DEBUG: Found', leafletContainers.length, 'Leaflet containers');
  
  let success = false;
  
  leafletContainers.forEach((container, index) => {
    console.log(`🔍 GeoJump DEBUG: Testing container ${index}:`, container);
    
    // Method 1: Try direct _leaflet_map access
    const leafletMap = (container as any)._leaflet_map;
    if (leafletMap) {
      console.log('🔍 GeoJump DEBUG: Found _leaflet_map:', leafletMap);
      if (typeof leafletMap.setView === 'function') {
        try {
          leafletMap.setView([lat, lon], zoom);
          console.log('🔍 GeoJump DEBUG: SUCCESS! Map view set to:', lat, lon, zoom);
          success = true;
          return;
        } catch (error) {
          console.error('🔍 GeoJump DEBUG: Error setting view:', error);
        }
      }
    } else {
      console.log('🔍 GeoJump DEBUG: No _leaflet_map found on container');
      
      // Method 2: Try to find map using Leaflet ID
      const leafletId = (container as any)._leaflet_id;
      console.log('🔍 GeoJump DEBUG: Container _leaflet_id:', leafletId);
      
      if (leafletId) {
        const L = (window as any).L;
        if (L) {
          console.log('🔍 GeoJump DEBUG: Trying to find map using Leaflet ID system');
          
          // Try to access Leaflet's internal map registry
          // Leaflet stores maps in various ways, let's try different approaches
          
          // Approach 1: Check if there's a global map registry
          if (L._leaflet_maps) {
            console.log('🔍 GeoJump DEBUG: Found L._leaflet_maps:', L._leaflet_maps);
            const mapFromRegistry = L._leaflet_maps[leafletId];
            if (mapFromRegistry && typeof mapFromRegistry.setView === 'function') {
              console.log('🔍 GeoJump DEBUG: Found map in registry:', mapFromRegistry);
              try {
                mapFromRegistry.setView([lat, lon], zoom);
                console.log('🔍 GeoJump DEBUG: SUCCESS! Map view set via registry');
                success = true;
                return;
              } catch (error) {
                console.error('🔍 GeoJump DEBUG: Error with registry map:', error);
              }
            }
          }
          
          // Approach 2: Try to find the map in Leaflet's stamp system
          console.log('🔍 GeoJump DEBUG: Searching Leaflet stamp system');
          
          // Look for the map in all possible locations
          const possibleMapLocations = [
            `_leaflet_map_${leafletId}`,
            `leaflet_map_${leafletId}`,
            `map_${leafletId}`,
            `_map_${leafletId}`
          ];
          
          for (const location of possibleMapLocations) {
            const globalMap = (window as any)[location] || L[location];
            if (globalMap && typeof globalMap.setView === 'function') {
              console.log(`🔍 GeoJump DEBUG: Found map at ${location}:`, globalMap);
              try {
                globalMap.setView([lat, lon], zoom);
                console.log('🔍 GeoJump DEBUG: SUCCESS! Map view set via global location');
                success = true;
                return;
              } catch (error) {
                console.error('🔍 GeoJump DEBUG: Error with global map:', error);
              }
            }
          }
          
          // Approach 3: Try to create a map reference using the existing container
          console.log('🔍 GeoJump DEBUG: Attempting to access existing map via container manipulation');
          
          try {
            // Since the container has Leaflet events and ID, there should be a map
            // Let's try to trigger events that might reveal the map instance
            
            // First, let's see if we can find the map by looking at event handlers
            const events = (container as any)._leaflet_events;
            console.log('🔍 GeoJump DEBUG: Container events:', events);
            
            if (events) {
              // Try to find event handlers that might contain map references
              Object.keys(events).forEach(eventType => {
                const handler = events[eventType];
                console.log(`🔍 GeoJump DEBUG: Found ${eventType} handler:`, handler);
                
                // Check if the handler has a context that might be the map
                if (handler && typeof handler === 'function') {
                  // Try to access the handler's context or bound object
                  if (handler.obj && typeof handler.obj.setView === 'function') {
                    console.log('🔍 GeoJump DEBUG: Found map in event handler obj:', handler.obj);
                    try {
                      handler.obj.setView([lat, lon], zoom);
                      console.log('🔍 GeoJump DEBUG: SUCCESS! Map view set via event handler');
                      success = true;
                      return;
                    } catch (error) {
                      console.error('🔍 GeoJump DEBUG: Error with event handler map:', error);
                    }
                  }
                  
                  // Try to access the handler's context
                  if (handler.context && typeof handler.context.setView === 'function') {
                    console.log('🔍 GeoJump DEBUG: Found map in event handler context:', handler.context);
                    try {
                      handler.context.setView([lat, lon], zoom);
                      console.log('🔍 GeoJump DEBUG: SUCCESS! Map view set via event handler context');
                      success = true;
                      return;
                    } catch (error) {
                      console.error('🔍 GeoJump DEBUG: Error with event handler context:', error);
                    }
                  }
                }
              });
            }
            
            // Approach 4: Try to manually trigger a map update by dispatching Leaflet events
            if (!success) {
              console.log('🔍 GeoJump DEBUG: Trying to trigger map update via Leaflet events');
              
              // Create a custom Leaflet event
              const customEvent = new CustomEvent('leaflet-setview', {
                detail: { lat, lon, zoom },
                bubbles: true
              });
              
              container.dispatchEvent(customEvent);
              
              // Also try standard Leaflet events
              const leafletEvents = ['moveend', 'zoomend', 'viewreset'];
              leafletEvents.forEach(eventName => {
                const event = new CustomEvent(eventName, {
                  detail: { lat, lon, zoom },
                  bubbles: true
                });
                container.dispatchEvent(event);
              });
            }
            
          } catch (error) {
            console.error('🔍 GeoJump DEBUG: Error in container manipulation:', error);
          }
        }
      }
      
      // Method 3: Search child elements for map references
      if (!success) {
        console.log('🔍 GeoJump DEBUG: Searching child elements for map references');
        const children = container.querySelectorAll('*');
        for (let i = 0; i < Math.min(children.length, 20); i++) { // Limit search
          const child = children[i] as any;
          if (child._leaflet_map && typeof child._leaflet_map.setView === 'function') {
            console.log('🔍 GeoJump DEBUG: Found _leaflet_map in child:', child._leaflet_map);
            try {
              child._leaflet_map.setView([lat, lon], zoom);
              console.log('🔍 GeoJump DEBUG: SUCCESS! Map view set via child element');
              success = true;
              break;
            } catch (error) {
              console.error('🔍 GeoJump DEBUG: Error setting view via child:', error);
            }
          }
        }
      }
    }
  });
  
  // Method 4: Try global Leaflet approach
  if (!success) {
    console.log('🔍 GeoJump DEBUG: No success with direct access, trying global Leaflet');
    
    const L = (window as any).L;
    if (L) {
      console.log('🔍 GeoJump DEBUG: Global Leaflet object found:', L);
      
      // Try to find any global map instances
      const globalProps = Object.getOwnPropertyNames(window).filter(prop => 
        prop.toLowerCase().includes('map') && !prop.includes('Map') // Exclude constructors
      );
      console.log('🔍 GeoJump DEBUG: Global map-related properties:', globalProps);
      
      for (const prop of globalProps) {
        const obj = (window as any)[prop];
        if (obj && typeof obj === 'object' && typeof obj.setView === 'function') {
          console.log(`🔍 GeoJump DEBUG: Found global map at window.${prop}:`, obj);
          try {
            obj.setView([lat, lon], zoom);
            console.log('🔍 GeoJump DEBUG: SUCCESS! Map view set via global object');
            success = true;
            break;
          } catch (error) {
            console.error('🔍 GeoJump DEBUG: Error with global map:', error);
          }
        }
      }
      
      // Try to access OpenSearch Dashboards specific map instances
      if (!success) {
        console.log('🔍 GeoJump DEBUG: Trying OpenSearch Dashboards specific approaches');
        
        // Look for visualization objects that might contain maps
        const visElements = document.querySelectorAll('.visualization, .visWrapper, .embPanel');
        visElements.forEach((visElement, index) => {
          console.log(`🔍 GeoJump DEBUG: Checking visualization element ${index}:`, visElement);
          
          // Try to access React props/state through the element
          const reactInstance = (visElement as any).__reactInternalInstance$3cyekfou8qi || 
                               (visElement as any).__reactInternalInstance;
          
          if (reactInstance) {
            console.log('🔍 GeoJump DEBUG: Found React instance, searching for map');
            
            // Try to find map in React component tree (simplified approach)
            const searchReactForMap = (instance: any, depth = 0) => {
              if (depth > 5) return null;
              
              try {
                // Check memoizedProps
                if (instance.memoizedProps) {
                  const props = instance.memoizedProps;
                  if (props.map && typeof props.map.setView === 'function') {
                    return props.map;
                  }
                }
                
                // Check stateNode
                if (instance.stateNode) {
                  const stateNode = instance.stateNode;
                  if (stateNode.map && typeof stateNode.map.setView === 'function') {
                    return stateNode.map;
                  }
                  if (stateNode._map && typeof stateNode._map.setView === 'function') {
                    return stateNode._map;
                  }
                }
                
                // Check child
                if (instance.child) {
                  const childResult = searchReactForMap(instance.child, depth + 1);
                  if (childResult) return childResult;
                }
                
              } catch (error) {
                // Continue searching
              }
              
              return null;
            };
            
            const reactMap = searchReactForMap(reactInstance);
            if (reactMap) {
              console.log('🔍 GeoJump DEBUG: Found map in React tree:', reactMap);
              try {
                reactMap.setView([lat, lon], zoom);
                console.log('🔍 GeoJump DEBUG: SUCCESS! Map view set via React tree');
                success = true;
                return;
              } catch (error) {
                console.error('🔍 GeoJump DEBUG: Error with React map:', error);
              }
            }
          }
        });
      }
    }
  }
  
  console.log('🔍 GeoJump DEBUG: Final result:', success ? 'SUCCESS' : 'FAILED');
  return success;
};

/**
 * Initialize map access helper
 */
export function initMapAccessHelper() {
  console.log('🔍 GeoJump DEBUG: Initializing map access helper');
  
  // Override map creation methods if available
  overrideMapboxGL();
  overrideLeaflet();
  
  // Set up event listener for geojump events
  setupEventListener();
  
  // Try to find existing maps
  findExistingMaps();
  
  // Set up observer to find maps that are added later
  setupMutationObserver();
}

/**
 * Override Mapbox GL map creation
 */
function overrideMapboxGL() {
  const win = window as any;
  const originalMapboxGL = win.mapboxgl;
  
  if (originalMapboxGL && originalMapboxGL.Map) {
    console.log('🔍 GeoJump DEBUG: Overriding Mapbox GL Map constructor');
    
    const originalMapConstructor = originalMapboxGL.Map;
    
    originalMapboxGL.Map = function(...args: any[]) {
      const map = new originalMapConstructor(...args);
      win.__geojump_maps.push(map);
      console.log('🔍 GeoJump DEBUG: Captured Mapbox map instance', map);
      return map;
    };
  }
}

/**
 * Override Leaflet map creation
 */
function overrideLeaflet() {
  const win = window as any;
  const originalL = win.L;
  
  if (originalL && originalL.map) {
    console.log('🔍 GeoJump DEBUG: Overriding Leaflet map function');
    
    const originalMapFunction = originalL.map;
    
    originalL.map = function(...args: any[]) {
      const map = originalMapFunction.apply(this, args);
      win.__geojump_maps.push(map);
      console.log('🔍 GeoJump DEBUG: Captured Leaflet map instance', map);
      return map;
    };
  }
}

/**
 * Set up event listener for geojump events
 */
function setupEventListener() {
  document.addEventListener('geojump', function(event: any) {
    const win = window as any;
    const { coordinates, options } = event.detail;
    console.log('🔍 GeoJump DEBUG: Received geojump event', coordinates, options);
    
    let mapManipulated = false;
    
    // Try to use captured map instances
    if (win.__geojump_maps && win.__geojump_maps.length > 0) {
      console.log('🔍 GeoJump DEBUG: Found', win.__geojump_maps.length, 'captured map instances');
      
      win.__geojump_maps.forEach(function(map: any, index: number) {
        try {
          console.log(`🔍 GeoJump DEBUG: Trying to use captured map ${index}:`, map);
          
          // Try different map methods
          if (typeof map.setView === 'function') {
            console.log('🔍 GeoJump DEBUG: Using setView method');
            map.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
            mapManipulated = true;
          } else if (typeof map.flyTo === 'function') {
            console.log('🔍 GeoJump DEBUG: Using flyTo method');
            map.flyTo({
              center: [coordinates.lon, coordinates.lat],
              zoom: coordinates.zoom || options.zoomLevel || 10,
              duration: options.animateTransition !== false ? 2000 : 0,
            });
            mapManipulated = true;
          } else if (typeof map.setCenter === 'function') {
            console.log('🔍 GeoJump DEBUG: Using setCenter method');
            map.setCenter([coordinates.lat, coordinates.lon]);
            
            if (typeof map.setZoom === 'function') {
              console.log('🔍 GeoJump DEBUG: Using setZoom method');
              map.setZoom(coordinates.zoom || options.zoomLevel || 10);
            }
            mapManipulated = true;
          }
        } catch (error) {
          console.error('🔍 GeoJump DEBUG: Error using map', error);
        }
      });
    } else {
      console.log('🔍 GeoJump DEBUG: No captured map instances found');
    }
    
    // If no maps were manipulated, try to find maps in the DOM
    if (!mapManipulated) {
      console.log('🔍 GeoJump DEBUG: No maps manipulated, searching for maps in DOM');
      
      // Try to find maps in the DOM
      findExistingMaps();
      
      // Try again with any newly found maps
      if (win.__geojump_maps && win.__geojump_maps.length > 0) {
        console.log('🔍 GeoJump DEBUG: Found', win.__geojump_maps.length, 'map instances after search');
        
        win.__geojump_maps.forEach(function(map: any, index: number) {
          try {
            console.log(`🔍 GeoJump DEBUG: Trying to use newly found map ${index}:`, map);
            
            // Try different map methods
            if (typeof map.setView === 'function') {
              console.log('🔍 GeoJump DEBUG: Using setView method on newly found map');
              map.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
              mapManipulated = true;
            } else if (typeof map.flyTo === 'function') {
              console.log('🔍 GeoJump DEBUG: Using flyTo method on newly found map');
              map.flyTo({
                center: [coordinates.lon, coordinates.lat],
                zoom: coordinates.zoom || options.zoomLevel || 10,
                duration: options.animateTransition !== false ? 2000 : 0,
              });
              mapManipulated = true;
            } else if (typeof map.setCenter === 'function') {
              console.log('🔍 GeoJump DEBUG: Using setCenter method on newly found map');
              map.setCenter([coordinates.lat, coordinates.lon]);
              
              if (typeof map.setZoom === 'function') {
                console.log('🔍 GeoJump DEBUG: Using setZoom method on newly found map');
                map.setZoom(coordinates.zoom || options.zoomLevel || 10);
              }
              mapManipulated = true;
            }
          } catch (error) {
            console.error('🔍 GeoJump DEBUG: Error using newly found map', error);
          }
        });
      }
    }
    
    // If still no maps were manipulated, try direct DOM manipulation
    if (!mapManipulated) {
      console.log('🔍 GeoJump DEBUG: Still no maps manipulated, trying direct DOM manipulation');
      tryDirectDOMManipulation(coordinates, options);
    }
  });
}

/**
 * Try direct DOM manipulation as a last resort
 */
function tryDirectDOMManipulation(coordinates: any, options: any) {
  console.log('🔍 GeoJump DEBUG: Attempting direct DOM manipulation');
  
  // Try to find and manipulate Leaflet maps directly
  const leafletContainers = document.querySelectorAll('.leaflet-container');
  console.log('🔍 GeoJump DEBUG: Found', leafletContainers.length, 'Leaflet containers for direct manipulation');
  
  let mapManipulated = false;
  
  leafletContainers.forEach((container, index) => {
    console.log(`🔍 GeoJump DEBUG: Trying direct manipulation on Leaflet container ${index}:`, container);
    
    // Method 1: Direct _leaflet_map property
    let leafletMap = (container as any)._leaflet_map;
    
    if (leafletMap && typeof leafletMap.setView === 'function') {
      console.log('🔍 GeoJump DEBUG: Found Leaflet map via _leaflet_map property');
      try {
        leafletMap.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        console.log('🔍 GeoJump DEBUG: Successfully set Leaflet view via _leaflet_map');
        mapManipulated = true;
        return;
      } catch (error) {
        console.error('🔍 GeoJump DEBUG: Error using _leaflet_map:', error);
      }
    }
    
    // Method 2: Try to access via global Leaflet registry
    const L = (window as any).L;
    if (L && !leafletMap) {
      console.log('🔍 GeoJump DEBUG: Trying to access map via global Leaflet object');
      
      // Get all Leaflet map instances from the global registry
      if (L._leaflet_id) {
        // Try to find the map by iterating through Leaflet's internal map registry
        for (let i = 1; i <= 100; i++) { // Reasonable limit
          try {
            const mapId = `map_${i}`;
            const globalMap = (window as any)[mapId] || L[mapId];
            if (globalMap && typeof globalMap.setView === 'function') {
              console.log(`🔍 GeoJump DEBUG: Found global Leaflet map: ${mapId}`);
              globalMap.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
              console.log('🔍 GeoJump DEBUG: Successfully set view via global map');
              mapManipulated = true;
              return;
            }
          } catch (error) {
            // Continue searching
          }
        }
      }
      
      // Method 3: Try to create a map reference to the existing container
      try {
        console.log('🔍 GeoJump DEBUG: Attempting to get existing map via Leaflet constructor');
        
        // Check if this container already has a map by looking for map panes
        const mapPane = container.querySelector('.leaflet-map-pane');
        if (mapPane) {
          console.log('🔍 GeoJump DEBUG: Container has map panes, attempting to access existing map');
          
          // Try to access the map through the container's Leaflet ID
          const leafletId = (container as any)._leaflet_id;
          if (leafletId && L._leaflet_id >= leafletId) {
            console.log('🔍 GeoJump DEBUG: Container has Leaflet ID:', leafletId);
            
            // Try to get the map from Leaflet's internal registry
            const mapFromRegistry = L._getMap ? L._getMap(leafletId) : null;
            if (mapFromRegistry && typeof mapFromRegistry.setView === 'function') {
              console.log('🔍 GeoJump DEBUG: Found map in Leaflet registry');
              mapFromRegistry.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
              mapManipulated = true;
              return;
            }
          }
          
          // Method 4: Try to manually trigger map update by manipulating the transform
          console.log('🔍 GeoJump DEBUG: Attempting manual map manipulation via CSS transforms');
          try {
            // Calculate the pixel position for the coordinates
            // This is a rough approximation - in a real implementation you'd need proper projection math
            const zoom = coordinates.zoom || options.zoomLevel || 10;
            const tileSize = 256;
            const scale = Math.pow(2, zoom);
            
            // Convert lat/lon to pixel coordinates (Web Mercator projection approximation)
            const x = ((coordinates.lon + 180) / 360) * tileSize * scale;
            const y = ((1 - Math.log(Math.tan(coordinates.lat * Math.PI / 180) + 1 / Math.cos(coordinates.lat * Math.PI / 180)) / Math.PI) / 2) * tileSize * scale;
            
            // Get the map pane and try to update its transform
            const mapPaneElement = mapPane as HTMLElement;
            const currentTransform = mapPaneElement.style.transform;
            console.log('🔍 GeoJump DEBUG: Current map pane transform:', currentTransform);
            
            // This is a very rough approach - ideally we'd use Leaflet's proper methods
            // But as a last resort, we can try to trigger a map update event
            const updateEvent = new CustomEvent('leaflet-update', {
              detail: { coordinates, zoom },
              bubbles: true
            });
            container.dispatchEvent(updateEvent);
            
          } catch (error) {
            console.error('🔍 GeoJump DEBUG: Error with manual map manipulation:', error);
          }
        }
      } catch (error) {
        console.error('🔍 GeoJump DEBUG: Error accessing existing map:', error);
      }
    }
    
    // Method 5: Try to find the map in the container's event handlers or data
    if (!mapManipulated) {
      console.log('🔍 GeoJump DEBUG: Searching container event handlers and data for map reference');
      
      // Check jQuery data if available
      if ((window as any).$ && (window as any).$(container).data) {
        const jqueryData = (window as any).$(container).data();
        console.log('🔍 GeoJump DEBUG: jQuery data:', jqueryData);
        
        if (jqueryData.leafletMap || jqueryData.map) {
          const jqueryMap = jqueryData.leafletMap || jqueryData.map;
          if (typeof jqueryMap.setView === 'function') {
            console.log('🔍 GeoJump DEBUG: Found map in jQuery data');
            jqueryMap.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
            mapManipulated = true;
          }
        }
      }
    }
  });
  
  // If we still haven't manipulated any maps, try a different approach
  if (!mapManipulated) {
    console.log('🔍 GeoJump DEBUG: No direct manipulation successful, trying event-based approach');
    
    // Dispatch events that Leaflet maps might listen to
    const events = [
      'leaflet-geojump',
      'map-setview',
      'map-update',
      'geojump'
    ];
    
    events.forEach(eventName => {
      const event = new CustomEvent(eventName, {
        detail: {
          coordinates,
          options,
          lat: coordinates.lat,
          lon: coordinates.lon,
          lng: coordinates.lon,
          zoom: coordinates.zoom || options.zoomLevel || 10
        },
        bubbles: true
      });
      
      // Dispatch on all leaflet containers
      leafletContainers.forEach(container => {
        container.dispatchEvent(event);
      });
      
      // Also dispatch globally
      document.dispatchEvent(event);
      window.dispatchEvent(event);
    });
    
    // Try to trigger a resize event which might cause maps to update
    setTimeout(() => {
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);
    }, 100);
  }
  
  return mapManipulated;
}

/**
 * Find existing maps in the DOM
 */
function findExistingMaps() {
  const win = window as any;
  console.log('🔍 GeoJump DEBUG: Searching for existing maps');
  
  // Look for map containers
  const mapContainers = document.querySelectorAll(
    '.mapboxgl-map, .leaflet-container, [data-test-subj*="map"], ' +
    '.vis-map, .tile-map, .region-map, .visMapChart, .mapContainer, ' +
    '.visChart__canvas--geo, .visChart__canvas--tilemap, .visChart__canvas--regionmap'
  );
  
  console.log('🔍 GeoJump DEBUG: Found', mapContainers.length, 'map containers');
  
  mapContainers.forEach((container, index) => {
    console.log(`🔍 GeoJump DEBUG: Processing container ${index}:`, container);
    
    // Try to find map instance in this container
    const mapInstance = findMapInstance(container as HTMLElement);
    
    if (mapInstance) {
      console.log('🔍 GeoJump DEBUG: Found map instance in container', container, mapInstance);
      win.__geojump_maps.push(mapInstance);
    } else {
      console.log('🔍 GeoJump DEBUG: No map instance found in container', container);
    }
  });
  
  // Try to find OpenSearch Dashboards visualizations
  const visElements = document.querySelectorAll('.visualization, .visWrapper, .embPanel');
  console.log('🔍 GeoJump DEBUG: Found', visElements.length, 'visualization elements');
  
  visElements.forEach((element, index) => {
    console.log(`🔍 GeoJump DEBUG: Processing visualization element ${index}:`, element);
    const el = element as any;
    
    // Try to access the visualization
    const vis = el.vis || el._vis || el.visualization;
    
    if (vis) {
      console.log('🔍 GeoJump DEBUG: Found visualization', vis);
      
      // Try to access the map
      const visMap = (vis as any).map || (vis as any)._map || (vis as any).handler?.maps?.[0];
      
      if (visMap) {
        console.log('🔍 GeoJump DEBUG: Found visualization map', visMap);
        win.__geojump_maps.push(visMap);
      } else {
        console.log('🔍 GeoJump DEBUG: No map found in visualization', vis);
        
        // Try to find map in the visualization element itself
        const elementMap = findMapInstance(element as HTMLElement);
        if (elementMap) {
          console.log('🔍 GeoJump DEBUG: Found map in visualization element', elementMap);
          win.__geojump_maps.push(elementMap);
        }
      }
    } else {
      console.log('🔍 GeoJump DEBUG: No visualization object found in element', element);
      
      // Try to find map directly in the element
      const elementMap = findMapInstance(element as HTMLElement);
      if (elementMap) {
        console.log('🔍 GeoJump DEBUG: Found map directly in element', elementMap);
        win.__geojump_maps.push(elementMap);
      }
    }
  });
  
  // Try to access OpenSearch Dashboards embeddables
  if (win.__osdAppPlugins && win.__osdAppPlugins.embeddable) {
    console.log('🔍 GeoJump DEBUG: Found embeddable API');
    
    const embeddableApi = win.__osdAppPlugins.embeddable;
    
    // Try to get all embeddables
    if (embeddableApi.getEmbeddablePanel) {
      const panel = embeddableApi.getEmbeddablePanel();
      
      if (panel && panel.getAllEmbeddables) {
        const embeddables = panel.getAllEmbeddables();
        console.log('🔍 GeoJump DEBUG: Found embeddables', embeddables);
        
        // Look for map embeddables
        Object.entries(embeddables).forEach(([id, embeddable]: [string, any]) => {
          if (embeddable.type && (
              embeddable.type.includes('map') || 
              embeddable.type.includes('tile') || 
              embeddable.type.includes('region')
          )) {
            console.log('🔍 GeoJump DEBUG: Found map embeddable', id, embeddable);
            win.__geojump_maps.push(embeddable);
          }
        });
      }
    }
  }
  
  // Try to find maps using global Leaflet and Mapbox objects
  console.log('🔍 GeoJump DEBUG: Searching for global map instances');
  
  // Check for global Leaflet maps
  if (win.L && win.L._leaflet_id) {
    console.log('🔍 GeoJump DEBUG: Found global Leaflet object');
    
    // Try to find all Leaflet map instances
    const leafletContainers = document.querySelectorAll('.leaflet-container');
    leafletContainers.forEach((container) => {
      const leafletMap = (container as any)._leaflet_map;
      if (leafletMap && !win.__geojump_maps.includes(leafletMap)) {
        console.log('🔍 GeoJump DEBUG: Found Leaflet map via global search:', leafletMap);
        win.__geojump_maps.push(leafletMap);
      }
    });
  }
  
  // Check for global Mapbox maps
  if (win.mapboxgl) {
    console.log('🔍 GeoJump DEBUG: Found global Mapbox GL object');
    
    // Try to find all Mapbox map instances
    const mapboxContainers = document.querySelectorAll('.mapboxgl-map');
    mapboxContainers.forEach((container) => {
      const mapboxMap = (container as any)._mapboxMap;
      if (mapboxMap && !win.__geojump_maps.includes(mapboxMap)) {
        console.log('🔍 GeoJump DEBUG: Found Mapbox map via global search:', mapboxMap);
        win.__geojump_maps.push(mapboxMap);
      }
    });
  }
  
  console.log('🔍 GeoJump DEBUG: Total maps found:', win.__geojump_maps.length);
}

/**
 * Find map instance in a container
 */
function findMapInstance(container: HTMLElement): any {
  console.log('🔍 GeoJump DEBUG: Looking for map instance in container:', container);
  console.log('🔍 GeoJump DEBUG: Container class list:', container.classList.toString());
  console.log('🔍 GeoJump DEBUG: Container id:', container.id);
  
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
    'mapboxgl',
    '_mapboxgl',
    'L',
    '_L',
  ];
  
  // Check container itself
  for (const path of possiblePaths) {
    if ((container as any)[path]) {
      console.log(`🔍 GeoJump DEBUG: Found map instance at container.${path}:`, (container as any)[path]);
      return (container as any)[path];
    }
  }
  
  // Check for Leaflet map - more thorough approach
  if (container.classList.contains('leaflet-container')) {
    console.log('🔍 GeoJump DEBUG: This is a Leaflet container, searching for Leaflet map instance');
    
    // Try multiple approaches to find Leaflet map
    const leafletMap = (container as any)._leaflet_map || 
                       (container as any)._map ||
                       (container as any).map;
    
    if (leafletMap) {
      console.log('🔍 GeoJump DEBUG: Found Leaflet map instance:', leafletMap);
      return leafletMap;
    }
    
    // Try to find Leaflet map in parent elements
    let parent = container.parentElement;
    while (parent) {
      if ((parent as any)._leaflet_map) {
        console.log('🔍 GeoJump DEBUG: Found Leaflet map in parent:', (parent as any)._leaflet_map);
        return (parent as any)._leaflet_map;
      }
      parent = parent.parentElement;
    }
    
    // Try to find Leaflet map in child elements
    const children = container.querySelectorAll('*');
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as any;
      if (child._leaflet_map) {
        console.log('🔍 GeoJump DEBUG: Found Leaflet map in child:', child._leaflet_map);
        return child._leaflet_map;
      }
    }
  }
  
  // Check for Mapbox map - more thorough approach
  if (container.classList.contains('mapboxgl-map')) {
    console.log('🔍 GeoJump DEBUG: This is a Mapbox container, searching for Mapbox map instance');
    
    // Try multiple approaches to find Mapbox map
    const mapboxMap = (container as any)._mapboxMap || 
                      (container as any)._map ||
                      (container as any).map ||
                      (container as any).mapboxgl;
    
    if (mapboxMap) {
      console.log('🔍 GeoJump DEBUG: Found Mapbox map instance:', mapboxMap);
      return mapboxMap;
    }
  }
  
  // Check for OpenSearch Dashboards visualization maps
  if (container.classList.contains('visMapChart') || 
      container.classList.contains('visChart__canvas') ||
      container.closest('.visualization') ||
      container.closest('.visWrapper')) {
    
    console.log('🔍 GeoJump DEBUG: This appears to be an OpenSearch Dashboards visualization');
    
    // Try to find the visualization element
    const visElement = container.closest('.visualization') || 
                       container.closest('.visWrapper') || 
                       container.closest('.embPanel') ||
                       container;
    
    if (visElement) {
      console.log('🔍 GeoJump DEBUG: Found visualization element:', visElement);
      
      // Try to access the visualization object
      const vis = (visElement as any).vis || 
                  (visElement as any)._vis || 
                  (visElement as any).visualization ||
                  (visElement as any).controller ||
                  (visElement as any).handler;
      
      if (vis) {
        console.log('🔍 GeoJump DEBUG: Found visualization object:', vis);
        
        // Try to get the map from the visualization
        const visMap = (vis as any).map || 
                       (vis as any)._map || 
                       (vis as any).handler?.maps?.[0] ||
                       (vis as any).mapHandler ||
                       (vis as any).chart;
        
        if (visMap) {
          console.log('🔍 GeoJump DEBUG: Found visualization map:', visMap);
          return visMap;
        }
      }
    }
  }
  
  // Try to find any map-like object in the container's properties
  console.log('🔍 GeoJump DEBUG: Searching all properties of container for map-like objects');
  const containerProps = Object.getOwnPropertyNames(container);
  console.log('🔍 GeoJump DEBUG: Container properties:', containerProps);
  
  for (const prop of containerProps) {
    const value = (container as any)[prop];
    if (value && typeof value === 'object') {
      // Check if this object has map-like methods
      if (typeof value.setView === 'function' || 
          typeof value.flyTo === 'function' || 
          typeof value.setCenter === 'function') {
        console.log(`🔍 GeoJump DEBUG: Found map-like object at container.${prop}:`, value);
        return value;
      }
    }
  }
  
  console.log('🔍 GeoJump DEBUG: No map instance found in container');
  return null;
}

/**
 * Set up mutation observer to find maps that are added later
 */
function setupMutationObserver() {
  const win = window as any;
  
  // Create a mutation observer to watch for new map elements
  const observer = new MutationObserver((mutations) => {
    let newMapFound = false;
    
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            // Check if this is a map container
            if (
              element.classList.contains('mapboxgl-map') ||
              element.classList.contains('leaflet-container') ||
              element.classList.contains('vis-map') ||
              element.classList.contains('tile-map') ||
              element.classList.contains('region-map') ||
              element.classList.contains('visMapChart') ||
              element.classList.contains('mapContainer') ||
              element.classList.contains('visChart__canvas--geo') ||
              element.classList.contains('visChart__canvas--tilemap') ||
              element.classList.contains('visChart__canvas--regionmap')
            ) {
              console.log('🔍 GeoJump DEBUG: Found new map container', element);
              
              // Try to find map instance in this container
              const mapInstance = findMapInstance(element);
              
              if (mapInstance) {
                console.log('🔍 GeoJump DEBUG: Found map instance in new container', mapInstance);
                win.__geojump_maps.push(mapInstance);
                newMapFound = true;
              }
            }
            
            // Also check children
            const mapContainers = element.querySelectorAll(
              '.mapboxgl-map, .leaflet-container, [data-test-subj*="map"], ' +
              '.vis-map, .tile-map, .region-map, .visMapChart, .mapContainer, ' +
              '.visChart__canvas--geo, .visChart__canvas--tilemap, .visChart__canvas--regionmap'
            );
            
            if (mapContainers.length > 0) {
              console.log('🔍 GeoJump DEBUG: Found', mapContainers.length, 'map containers in new element');
              
              mapContainers.forEach((container) => {
                // Try to find map instance in this container
                const mapInstance = findMapInstance(container as HTMLElement);
                
                if (mapInstance) {
                  console.log('🔍 GeoJump DEBUG: Found map instance in new container', container, mapInstance);
                  win.__geojump_maps.push(mapInstance);
                  newMapFound = true;
                }
              });
            }
          }
        });
      }
    });
    
    if (newMapFound) {
      console.log('🔍 GeoJump DEBUG: New maps found, total maps:', win.__geojump_maps.length);
    }
  });
  
  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  console.log('🔍 GeoJump DEBUG: Set up mutation observer');
}
