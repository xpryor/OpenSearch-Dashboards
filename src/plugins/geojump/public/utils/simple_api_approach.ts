import { GeojumpCoordinates, GeojumpOptions } from '../../common';

export async function jumpUsingSimpleAPI(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): Promise<boolean> {
  try {
    console.log('🔍 GeoJump DEBUG: Using simple API approach');
    
    const { lazyLoadMapsLegacyModules } = await import('../../../maps_legacy/public');
    const modules = await lazyLoadMapsLegacyModules();
    const { L } = modules;
    
    console.log('🔍 GeoJump DEBUG: Loaded Leaflet:', L);
    
    const mapContainers = document.querySelectorAll('.leaflet-container');
    console.log(`🔍 GeoJump DEBUG: Found ${mapContainers.length} map containers`);
    
    for (const container of mapContainers) {
      console.log('🔍 GeoJump DEBUG: Checking container:', container);
      
      // Get the Leaflet ID from the container
      const leafletId = (container as any)._leaflet_id;
      console.log('🔍 GeoJump DEBUG: Container Leaflet ID:', leafletId);
      
      if (leafletId) {
        // Access the map instance through Leaflet's internal registry
        // In Leaflet, objects are stored in L.Util._objects or similar
        let mapInstance = null;
        
        // Try different ways to access the Leaflet object registry
        const possibleRegistries = [
          L.Util && L.Util._objects,
          (L as any)._objects,
          (window as any).L && (window as any).L._objects,
          (L as any).stamp && (L as any).stamp._objects
        ];
        
        for (const registry of possibleRegistries) {
          if (registry && registry[leafletId]) {
            mapInstance = registry[leafletId];
            console.log('🔍 GeoJump DEBUG: Found map instance in registry:', mapInstance);
            break;
          }
        }
        
        // Alternative approach: try to find the map by checking if the container has map methods
        if (!mapInstance) {
          console.log('🔍 GeoJump DEBUG: Registry approach failed, trying direct container access');
          
          // Sometimes the map methods are attached directly to the container
          if (typeof (container as any).setView === 'function') {
            mapInstance = container;
            console.log('🔍 GeoJump DEBUG: Container itself has map methods');
          }
        }
        
        // Another approach: use Leaflet's DomUtil to find the map
        if (!mapInstance && L.DomUtil) {
          console.log('🔍 GeoJump DEBUG: Trying L.DomUtil approach');
          try {
            // Try to get the map through Leaflet's DOM utilities
            const mapFromDom = (L.DomUtil as any).getMapFromContainer && (L.DomUtil as any).getMapFromContainer(container);
            if (mapFromDom) {
              mapInstance = mapFromDom;
              console.log('🔍 GeoJump DEBUG: Found map via DomUtil:', mapInstance);
            }
          } catch (error) {
            console.log('🔍 GeoJump DEBUG: DomUtil approach failed:', error.message);
          }
        }
        
        // Final approach: iterate through all possible Leaflet objects
        if (!mapInstance) {
          console.log('🔍 GeoJump DEBUG: Trying to find map in global Leaflet objects');
          
          // Check if there's a global registry we can iterate through
          if ((window as any).L && (window as any).L._leaflet_id) {
            for (let i = 1; i <= 100; i++) { // Check first 100 IDs
              const obj = (L as any)[`_leaflet_${i}`] || (window as any)[`_leaflet_${i}`];
              if (obj && typeof obj.setView === 'function') {
                console.log(`🔍 GeoJump DEBUG: Found potential map object at ID ${i}:`, obj);
                
                // Check if this map's container matches our container
                if (obj._container === container || obj.getContainer && obj.getContainer() === container) {
                  mapInstance = obj;
                  console.log('🔍 GeoJump DEBUG: Confirmed map instance match!');
                  break;
                }
              }
            }
          }
        }
        
        // Try the jump if we found a map instance
        if (mapInstance && typeof mapInstance.setView === 'function') {
          console.log('🔍 GeoJump DEBUG: Calling setView on map instance...');
          mapInstance.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
          console.log('🔍 GeoJump DEBUG: SUCCESS!');
          return true;
        } else {
          console.log('🔍 GeoJump DEBUG: No valid map instance found for this container');
        }
      }
    }
    
    console.log('🔍 GeoJump DEBUG: No suitable map instances found');
    return false;
  } catch (error) {
    console.error('🔍 GeoJump DEBUG: Error:', error);
    return false;
  }
}

// Add test function to global scope immediately
setTimeout(() => {
  (window as any).testSimpleAPI = async (lat = 40.7128, lon = -74.0060, zoom = 12) => {
    console.log('🔍 GeoJump DEBUG: Testing simple API approach');
    return await jumpUsingSimpleAPI({ lat, lon, zoom });
  };
  
  (window as any).inspectMapContainer = () => {
    const containers = document.querySelectorAll('.leaflet-container');
    containers.forEach((container, index) => {
      console.log(`🔍 GeoJump DEBUG: Container ${index}:`, container);
      console.log(`🔍 GeoJump DEBUG: Container ${index} properties:`, Object.getOwnPropertyNames(container));
      console.log(`🔍 GeoJump DEBUG: Container ${index} _leaflet_id:`, (container as any)._leaflet_id);
      
      const allProps = Object.getOwnPropertyNames(container);
      const mapRelatedProps = allProps.filter(prop => 
        prop.toLowerCase().includes('map') || 
        prop.toLowerCase().includes('leaflet')
      );
      console.log(`🔍 GeoJump DEBUG: Container ${index} map-related properties:`, mapRelatedProps);
      
      mapRelatedProps.forEach(prop => {
        console.log(`🔍 GeoJump DEBUG: Container ${index}.${prop}:`, (container as any)[prop]);
      });
    });
  };
  
  // Add function to inspect Leaflet's internal state
  (window as any).inspectLeafletInternals = async () => {
    try {
      const { lazyLoadMapsLegacyModules } = await import('../../../maps_legacy/public');
      const modules = await lazyLoadMapsLegacyModules();
      const { L } = modules;
      
      console.log('🔍 GeoJump DEBUG: Leaflet object:', L);
      console.log('🔍 GeoJump DEBUG: Leaflet.Util:', L.Util);
      console.log('🔍 GeoJump DEBUG: Leaflet version:', L.version);
      
      // Check for object registries
      if (L.Util && L.Util._objects) {
        console.log('🔍 GeoJump DEBUG: L.Util._objects:', L.Util._objects);
      }
      
      if ((L as any)._objects) {
        console.log('🔍 GeoJump DEBUG: L._objects:', (L as any)._objects);
      }
      
      // Check global window for Leaflet objects
      const windowProps = Object.getOwnPropertyNames(window).filter(prop => 
        prop.toLowerCase().includes('leaflet') || prop.toLowerCase().includes('map')
      );
      console.log('🔍 GeoJump DEBUG: Window Leaflet-related properties:', windowProps);
      
    } catch (error) {
      console.error('🔍 GeoJump DEBUG: Error inspecting Leaflet internals:', error);
    }
  };
  
  console.log('🔍 GeoJump DEBUG: All debug functions added to global scope');
}, 1000);
