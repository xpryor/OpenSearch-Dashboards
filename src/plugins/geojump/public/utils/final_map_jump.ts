import { GeojumpCoordinates, GeojumpOptions } from '../../common';

(window as any).finalMapJump = function(lat: number = 40.7128, lon: number = -74.0060) {
  const tileContainer = document.querySelector('.leaflet-tile-container') as HTMLElement;
  const mapPane = document.querySelector('.leaflet-pane.leaflet-map-pane') as HTMLElement;
  
  if (!tileContainer || !mapPane) return false;
  
  const currentTransform = tileContainer.style.transform;
  const match = currentTransform.match(/translate3d\(([^,]+),\s*([^,]+),\s*([^)]+)\)\s*scale\(([^)]+)\)/);
  
  let x = 0, y = 0, z = 0, scale = 1;
  if (match) {
    x = parseFloat(match[1]);
    y = parseFloat(match[2]);
    z = parseFloat(match[3]);
    scale = parseFloat(match[4]);
  }
  
  const deltaX = lon * 5;
  const deltaY = -lat * 5;
  
  const newX = x - deltaX;
  const newY = y - deltaY;
  
  tileContainer.style.transform = `translate3d(${newX}px, ${newY}px, ${z}px) scale(${scale})`;
  mapPane.style.transform = 'translate3d(0px, 0px, 0px)';
  
  return true;
};

export function jumpToCoordinatesFinal(coordinates: GeojumpCoordinates): boolean {
  return (window as any).finalMapJump(coordinates.lat, coordinates.lon);
}
