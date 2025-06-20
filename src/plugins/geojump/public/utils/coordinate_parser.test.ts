import { CoordinateParser } from './coordinate_parser';
import { CoordinateFormat } from '../../common';

describe('CoordinateParser', () => {
  describe('parseCoordinates', () => {
    it('should parse decimal degrees with comma separator', () => {
      const result = CoordinateParser.parseCoordinates('40.7128, -74.0060');
      expect(result).toEqual({ lat: 40.7128, lon: -74.0060 });
    });

    it('should parse decimal degrees with space separator', () => {
      const result = CoordinateParser.parseCoordinates('40.7128 -74.0060');
      expect(result).toEqual({ lat: 40.7128, lon: -74.0060 });
    });

    it('should parse degrees, minutes, seconds format', () => {
      const result = CoordinateParser.parseCoordinates('40°42\'46"N 74°0\'21"W');
      expect(result).toBeDefined();
      expect(result?.lat).toBeCloseTo(40.7128, 3);
      expect(result?.lon).toBeCloseTo(-74.0058, 3);
    });

    it('should parse degrees, decimal minutes format', () => {
      const result = CoordinateParser.parseCoordinates('40°42.767\'N 74°0.35\'W');
      expect(result).toBeDefined();
      expect(result?.lat).toBeCloseTo(40.7128, 3);
      expect(result?.lon).toBeCloseTo(-74.0058, 3);
    });

    it('should return null for invalid input', () => {
      expect(CoordinateParser.parseCoordinates('')).toBeNull();
      expect(CoordinateParser.parseCoordinates('invalid')).toBeNull();
      expect(CoordinateParser.parseCoordinates('40.7128')).toBeNull();
      expect(CoordinateParser.parseCoordinates('40.7128, invalid')).toBeNull();
    });

    it('should validate latitude range', () => {
      expect(CoordinateParser.parseCoordinates('91, 0')).toBeNull();
      expect(CoordinateParser.parseCoordinates('-91, 0')).toBeNull();
      expect(CoordinateParser.parseCoordinates('90, 0')).toEqual({ lat: 90, lon: 0 });
      expect(CoordinateParser.parseCoordinates('-90, 0')).toEqual({ lat: -90, lon: 0 });
    });

    it('should validate longitude range', () => {
      expect(CoordinateParser.parseCoordinates('0, 181')).toBeNull();
      expect(CoordinateParser.parseCoordinates('0, -181')).toBeNull();
      expect(CoordinateParser.parseCoordinates('0, 180')).toEqual({ lat: 0, lon: 180 });
      expect(CoordinateParser.parseCoordinates('0, -180')).toEqual({ lat: 0, lon: -180 });
    });
  });

  describe('formatCoordinates', () => {
    const coordinates = { lat: 40.7128, lon: -74.0060 };

    it('should format as decimal degrees', () => {
      const result = CoordinateParser.formatCoordinates(coordinates, CoordinateFormat.DECIMAL_DEGREES);
      expect(result).toBe('40.712800, -74.006000');
    });

    it('should format as degrees, minutes, seconds', () => {
      const result = CoordinateParser.formatCoordinates(coordinates, CoordinateFormat.DEGREES_MINUTES_SECONDS);
      expect(result).toContain('40°');
      expect(result).toContain('42\'');
      expect(result).toContain('N');
      expect(result).toContain('74°');
      expect(result).toContain('W');
    });

    it('should format as degrees, decimal minutes', () => {
      const result = CoordinateParser.formatCoordinates(coordinates, CoordinateFormat.DEGREES_DECIMAL_MINUTES);
      expect(result).toContain('40°');
      expect(result).toContain('42.768\'');
      expect(result).toContain('N');
      expect(result).toContain('74°');
      expect(result).toContain('W');
    });
  });

  describe('validateInput', () => {
    it('should validate correct inputs', () => {
      const result = CoordinateParser.validateInput('40.7128, -74.0060');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty input', () => {
      const result = CoordinateParser.validateInput('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter coordinates');
    });

    it('should reject invalid format', () => {
      const result = CoordinateParser.validateInput('invalid coordinates');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid coordinate format');
    });
  });
});

describe('Edge cases', () => {
  it('should handle coordinates at poles', () => {
    const northPole = CoordinateParser.parseCoordinates('90, 0');
    const southPole = CoordinateParser.parseCoordinates('-90, 0');
    
    expect(northPole).toEqual({ lat: 90, lon: 0 });
    expect(southPole).toEqual({ lat: -90, lon: 0 });
  });

  it('should handle coordinates at date line', () => {
    const eastDateLine = CoordinateParser.parseCoordinates('0, 180');
    const westDateLine = CoordinateParser.parseCoordinates('0, -180');
    
    expect(eastDateLine).toEqual({ lat: 0, lon: 180 });
    expect(westDateLine).toEqual({ lat: 0, lon: -180 });
  });

  it('should handle coordinates with extra whitespace', () => {
    const result = CoordinateParser.parseCoordinates('  40.7128  ,  -74.0060  ');
    expect(result).toEqual({ lat: 40.7128, lon: -74.0060 });
  });

  it('should handle coordinates with various separators', () => {
    const commaResult = CoordinateParser.parseCoordinates('40.7128,-74.0060');
    const spaceResult = CoordinateParser.parseCoordinates('40.7128 -74.0060');
    const tabResult = CoordinateParser.parseCoordinates('40.7128\t-74.0060');
    
    expect(commaResult).toEqual({ lat: 40.7128, lon: -74.0060 });
    expect(spaceResult).toEqual({ lat: 40.7128, lon: -74.0060 });
    expect(tabResult).toEqual({ lat: 40.7128, lon: -74.0060 });
  });
});
