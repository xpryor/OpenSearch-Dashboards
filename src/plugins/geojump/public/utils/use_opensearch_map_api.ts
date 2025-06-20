import { GeojumpCoordinates, GeojumpOptions } from '../../common';

export async function jumpUsingOpenSearchMapAPI(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): Promise<boolean> {
  console.log('🔍 GeoJump DEBUG: Using OpenSearch Dashboards Map API directly');
  
  try {
    const { lazyLoadMapsLegacyModules } = await import('../../maps_legacy/public');
    
    console.log('🔍 GeoJump DEBUG: Loading maps legacy modules...');
    const modules = await lazyLoadMapsLegacyModules();
    
    console.log('🔍 GeoJump DEBUG: Loaded modules:', modules);
    
    const { OpenSearchDashboardsMap, L } = modules;
    
    const mapContainers = document.querySelectorAll('.leaflet-container');
    console.log(`🔍 GeoJump DEBUG: Found ${mapContainers.length} map containers`);
    
    if (mapContainers.length === 0) {
      return false;
    }
    
    let success = false;
    
    mapContainers.forEach((container, index) => {
      const mapInstance = (container as any)._leaflet_map || (container as any).__leafletMapInstance;
      
      if (mapInstance && typeof mapInstance.setView === 'function') {
        try {
          mapInstance.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
          console.log(`🔍 GeoJump DEBUG: SUCCESS! Used Leaflet setView on container ${index}`);
          success = true;
        } catch (error) {
          console.error(`🔍 GeoJump DEBUG: Error with container ${index}:`, error);
        }
      }
    });
    
    return success;
    
  } catch (error) {
    console.error('🔍 GeoJump DEBUG: Error using OpenSearch Map API:', error);
    return false;
  }
}

(window as any).testOpenSearchMapAPI = async (lat = 40.7128, lon = -74.0060, zoom = 12) => {
  return await jumpUsingOpenSearchMapAPI({ lat, lon, zoom });
};
