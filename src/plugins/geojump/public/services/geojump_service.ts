import { BehaviorSubject, Observable } from 'rxjs';
import { GeojumpCoordinates, GeojumpOptions, GEOJUMP_EVENTS, DEFAULT_ZOOM_LEVEL } from '../../common';
import { CoordinateParser } from '../utils/coordinate_parser';

export interface GeojumpEvent {
  type: string;
  payload: any;
}

/**
 * Service for managing geojump functionality across the application
 */
export class GeojumpService {
  private eventSubject = new BehaviorSubject<GeojumpEvent | null>(null);
  private currentCoordinates: GeojumpCoordinates | null = null;

  /**
   * Get observable for geojump events
   */
  public getEvents(): Observable<GeojumpEvent | null> {
    return this.eventSubject.asObservable();
  }

  /**
   * Jump to specified coordinates
   */
  public jumpToCoordinates(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): void {
    const jumpCoordinates: GeojumpCoordinates = {
      ...coordinates,
      zoom: options.zoomLevel || coordinates.zoom || DEFAULT_ZOOM_LEVEL,
    };

    this.currentCoordinates = jumpCoordinates;

    // Emit jump event
    this.eventSubject.next({
      type: GEOJUMP_EVENTS.JUMP_TO_COORDINATES,
      payload: {
        coordinates: jumpCoordinates,
        options,
      },
    });
  }

  /**
   * Parse coordinate string and jump if valid
   */
  public jumpToCoordinateString(input: string, options: GeojumpOptions = {}): boolean {
    const coordinates = CoordinateParser.parseCoordinates(input);
    
    if (!coordinates) {
      return false;
    }

    this.jumpToCoordinates(coordinates, options);
    return true;
  }

  /**
   * Get current coordinates
   */
  public getCurrentCoordinates(): GeojumpCoordinates | null {
    return this.currentCoordinates;
  }

  /**
   * Parse coordinates using the coordinate parser
   */
  public parseCoordinates(input: string): GeojumpCoordinates | null {
    return CoordinateParser.parseCoordinates(input);
  }

  /**
   * Format coordinates to string
   */
  public formatCoordinates(coordinates: GeojumpCoordinates, format: string): string {
    return CoordinateParser.formatCoordinates(coordinates, format as any);
  }

  /**
   * Validate coordinate input
   */
  public validateCoordinates(input: string): { isValid: boolean; error?: string } {
    return CoordinateParser.validateInput(input);
  }

  /**
   * Emit coordinates changed event
   */
  public emitCoordinatesChanged(coordinates: GeojumpCoordinates): void {
    this.eventSubject.next({
      type: GEOJUMP_EVENTS.COORDINATES_CHANGED,
      payload: { coordinates },
    });
  }

  /**
   * Emit format changed event
   */
  public emitFormatChanged(format: string): void {
    this.eventSubject.next({
      type: GEOJUMP_EVENTS.FORMAT_CHANGED,
      payload: { format },
    });
  }

  /**
   * Clean up service
   */
  public destroy(): void {
    this.eventSubject.complete();
  }
}
