import { GeojumpCoordinates, GeojumpOptions } from '../../common';

export function jumpUsingPluginCommunication(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
  const win = window as any;
  const mapsLegacy = win.__osdAppPlugins?.mapsLegacy || win.plugins?.mapsLegacy;
  
  if (mapsLegacy) {
    console.log('🔍 GeoJump DEBUG: Found maps_legacy plugin:', mapsLegacy);
    
    if (mapsLegacy.getMapInstances && typeof mapsLegacy.getMapInstances === 'function') {
      const mapInstances = mapsLegacy.getMapInstances();
      if (mapInstances && mapInstances.length > 0) {
        mapInstances.forEach((map: any) => {
          if (typeof map.setView === 'function') {
            map.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
            return true;
          }
        });
      }
    }
    
    if (mapsLegacy.jumpToCoordinates && typeof mapsLegacy.jumpToCoordinates === 'function') {
      try {
        mapsLegacy.jumpToCoordinates(coordinates.lat, coordinates.lon, coordinates.zoom || options.zoomLevel || 10);
        return true;
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
  
  return false;
}

(window as any).testPluginCommunication = (lat = 40.7128, lon = -74.0060, zoom = 12) => {
  return jumpUsingPluginCommunication({ lat, lon, zoom });
};

(window as any).inspectPlugins = () => {
  const win = window as any;
  console.log('Available plugins:', win.__osdAppPlugins);
  
  if (win.__osdAppPlugins) {
    console.log('Plugin keys:', Object.keys(win.__osdAppPlugins));
    
    if (win.__osdAppPlugins.mapsLegacy) {
      console.log('mapsLegacy methods:', 
        Object.getOwnPropertyNames(win.__osdAppPlugins.mapsLegacy)
          .filter(prop => typeof win.__osdAppPlugins.mapsLegacy[prop] === 'function')
      );
    }
  }
};
