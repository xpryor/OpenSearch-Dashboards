import { GeojumpCoordinates, CoordinateFormat, COORDINATE_PATTERNS } from '../../common';

/**
 * Parse various coordinate formats and return standardized decimal degrees
 */
export class CoordinateParser {
  /**
   * Parse coordinate input string and return GeojumpCoordinates
   */
  static parseCoordinates(input: string): GeojumpCoordinates | null {
    if (!input || typeof input !== 'string') {
      return null;
    }

    const trimmedInput = input.trim();
    
    // Try parsing as decimal degrees (lat, lon)
    const decimalResult = this.parseDecimalDegrees(trimmedInput);
    if (decimalResult) {
      return decimalResult;
    }

    // Try parsing as degrees, minutes, seconds
    const dmsResult = this.parseDegreesMinutesSeconds(trimmedInput);
    if (dmsResult) {
      return dmsResult;
    }

    // Try parsing as degrees, decimal minutes
    const ddmResult = this.parseDegreesDecimalMinutes(trimmedInput);
    if (ddmResult) {
      return ddmResult;
    }

    return null;
  }

  /**
   * Parse decimal degrees format: "40.7128, -74.0060" or "40.7128 -74.0060"
   */
  private static parseDecimalDegrees(input: string): GeojumpCoordinates | null {
    // Remove extra whitespace and split by comma or space
    const parts = input.replace(/\s+/g, ' ').split(/[,\s]+/);
    
    if (parts.length !== 2) {
      return null;
    }

    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);

    if (isNaN(lat) || isNaN(lon)) {
      return null;
    }

    if (!this.isValidLatitude(lat) || !this.isValidLongitude(lon)) {
      return null;
    }

    return { lat, lon };
  }

  /**
   * Parse degrees, minutes, seconds format: "40°42'46"N 74°0'21"W"
   */
  private static parseDegreesMinutesSeconds(input: string): GeojumpCoordinates | null {
    // Try different DMS patterns
    const patterns = [
      /(\d{1,3})°\s*(\d{1,2})'\s*(\d{1,2}(?:\.\d+)?)"?\s*([NSEW])\s*(\d{1,3})°\s*(\d{1,2})'\s*(\d{1,2}(?:\.\d+)?)"?\s*([NSEW])/i,
      /(\d{1,3})°\s*(\d{1,2})'\s*(\d{1,2}(?:\.\d+)?)"?\s*([NSEW])\s*,?\s*(\d{1,3})°\s*(\d{1,2})'\s*(\d{1,2}(?:\.\d+)?)"?\s*([NSEW])/i,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        const [, latDeg, latMin, latSec, latDir, lonDeg, lonMin, lonSec, lonDir] = match;

        const lat = this.dmsToDecimal(
          parseInt(latDeg, 10),
          parseInt(latMin, 10),
          parseFloat(latSec),
          latDir.toUpperCase()
        );

        const lon = this.dmsToDecimal(
          parseInt(lonDeg, 10),
          parseInt(lonMin, 10),
          parseFloat(lonSec),
          lonDir.toUpperCase()
        );

        if (lat !== null && lon !== null) {
          return { lat, lon };
        }
      }
    }

    return null;
  }

  /**
   * Parse degrees, decimal minutes format: "40°42.767'N 74°0.35'W"
   */
  private static parseDegreesDecimalMinutes(input: string): GeojumpCoordinates | null {
    // Try different DDM patterns
    const patterns = [
      /(\d{1,3})°\s*(\d{1,2}(?:\.\d+)?)'?\s*([NSEW])\s*(\d{1,3})°\s*(\d{1,2}(?:\.\d+)?)'?\s*([NSEW])/i,
      /(\d{1,3})°\s*(\d{1,2}(?:\.\d+)?)'?\s*([NSEW])\s*,?\s*(\d{1,3})°\s*(\d{1,2}(?:\.\d+)?)'?\s*([NSEW])/i,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        const [, latDeg, latMin, latDir, lonDeg, lonMin, lonDir] = match;

        const lat = this.ddmToDecimal(
          parseInt(latDeg, 10),
          parseFloat(latMin),
          latDir.toUpperCase()
        );

        const lon = this.ddmToDecimal(
          parseInt(lonDeg, 10),
          parseFloat(lonMin),
          lonDir.toUpperCase()
        );

        if (lat !== null && lon !== null) {
          return { lat, lon };
        }
      }
    }

    return null;
  }

  /**
   * Convert degrees, minutes, seconds to decimal degrees
   */
  private static dmsToDecimal(degrees: number, minutes: number, seconds: number, direction: string): number | null {
    if (degrees < 0 || minutes < 0 || seconds < 0 || minutes >= 60 || seconds >= 60) {
      return null;
    }

    let decimal = degrees + minutes / 60 + seconds / 3600;

    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }

    return decimal;
  }

  /**
   * Convert degrees, decimal minutes to decimal degrees
   */
  private static ddmToDecimal(degrees: number, minutes: number, direction: string): number | null {
    if (degrees < 0 || minutes < 0 || minutes >= 60) {
      return null;
    }

    let decimal = degrees + minutes / 60;

    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }

    return decimal;
  }

  /**
   * Validate latitude value
   */
  private static isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  /**
   * Validate longitude value
   */
  private static isValidLongitude(lon: number): boolean {
    return lon >= -180 && lon <= 180;
  }

  /**
   * Format coordinates to specified format
   */
  static formatCoordinates(coordinates: GeojumpCoordinates, format: CoordinateFormat): string {
    switch (format) {
      case CoordinateFormat.DECIMAL_DEGREES:
        return `${coordinates.lat.toFixed(6)}, ${coordinates.lon.toFixed(6)}`;
      
      case CoordinateFormat.DEGREES_MINUTES_SECONDS:
        return `${this.decimalToDMS(coordinates.lat, true)} ${this.decimalToDMS(coordinates.lon, false)}`;
      
      case CoordinateFormat.DEGREES_DECIMAL_MINUTES:
        return `${this.decimalToDDM(coordinates.lat, true)} ${this.decimalToDDM(coordinates.lon, false)}`;
      
      default:
        return `${coordinates.lat.toFixed(6)}, ${coordinates.lon.toFixed(6)}`;
    }
  }

  /**
   * Convert decimal degrees to degrees, minutes, seconds format
   */
  private static decimalToDMS(decimal: number, isLatitude: boolean): string {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = (minutesFloat - minutes) * 60;

    const direction = this.getDirection(decimal, isLatitude);
    
    return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
  }

  /**
   * Convert decimal degrees to degrees, decimal minutes format
   */
  private static decimalToDDM(decimal: number, isLatitude: boolean): string {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutes = (absolute - degrees) * 60;

    const direction = this.getDirection(decimal, isLatitude);
    
    return `${degrees}°${minutes.toFixed(3)}'${direction}`;
  }

  /**
   * Get direction letter based on coordinate value and type
   */
  private static getDirection(value: number, isLatitude: boolean): string {
    if (isLatitude) {
      return value >= 0 ? 'N' : 'S';
    } else {
      return value >= 0 ? 'E' : 'W';
    }
  }

  /**
   * Validate coordinate input format
   */
  static validateInput(input: string): { isValid: boolean; error?: string } {
    if (!input || input.trim().length === 0) {
      return { isValid: false, error: 'Please enter coordinates' };
    }

    const coordinates = this.parseCoordinates(input);
    
    if (!coordinates) {
      return { 
        isValid: false, 
        error: 'Invalid coordinate format. Try: "40.7128, -74.0060" or "40°42\'46"N 74°0\'21"W"' 
      };
    }

    return { isValid: true };
  }
}
