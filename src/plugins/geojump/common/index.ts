export const PLUGIN_ID = 'geojump';
export const PLUGIN_NAME = 'GeoJump';

// Coordinate formats supported
export enum CoordinateFormat {
  DECIMAL_DEGREES = 'decimal_degrees',
  DEGREES_MINUTES_SECONDS = 'degrees_minutes_seconds',
  DEGREES_DECIMAL_MINUTES = 'degrees_decimal_minutes',
}

// Default zoom level for geojump
export const DEFAULT_ZOOM_LEVEL = 10;

// Coordinate validation patterns
export const COORDINATE_PATTERNS = {
  [CoordinateFormat.DECIMAL_DEGREES]: {
    lat: /^-?([0-8]?[0-9](\.[0-9]+)?|90(\.0+)?)$/,
    lon: /^-?(1[0-7][0-9](\.[0-9]+)?|[0-9]?[0-9](\.[0-9]+)?|180(\.0+)?)$/,
  },
  [CoordinateFormat.DEGREES_MINUTES_SECONDS]: {
    pattern: /^(\d{1,3})°\s*(\d{1,2})'\s*(\d{1,2}(?:\.\d+)?)"?\s*([NSEW])$/i,
  },
  [CoordinateFormat.DEGREES_DECIMAL_MINUTES]: {
    pattern: /^(\d{1,3})°\s*(\d{1,2}(?:\.\d+)?)'?\s*([NSEW])$/i,
  },
};

// Event types for geojump actions
export const GEOJUMP_EVENTS = {
  JUMP_TO_COORDINATES: 'geojump:jumpToCoordinates',
  COORDINATES_CHANGED: 'geojump:coordinatesChanged',
  FORMAT_CHANGED: 'geojump:formatChanged',
};

export interface GeojumpCoordinates {
  lat: number;
  lon: number;
  zoom?: number;
}

export interface GeojumpOptions {
  showMarker?: boolean;
  markerDuration?: number;
  animateTransition?: boolean;
  zoomLevel?: number;
}
