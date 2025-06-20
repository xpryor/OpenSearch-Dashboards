import { Subject, Observable } from 'rxjs';
import { GeojumpCoordinates, GeojumpOptions, GEOJUMP_EVENTS } from '../../common';
import { CoordinateParser } from '../utils/coordinate_parser';
import { geojumpMapService } from '../map_integration/geojump_map_service';
import { geojumpVisualizationExtension } from '../map_integration/geojump_visualization_extension';

export interface GeojumpEvent {
  type: string;
  payload: any;
}

/**
 * Refactored GeoJump Service - Properly integrated with OpenSearch Dashboards maps
 */
export class GeojumpServiceRefactored {
  private eventSubject = new Subject<GeojumpEvent | null>();
  private isInitialized = false;

  constructor() {
    console.log('🔍 GeoJump: GeojumpServiceRefactored initialized');
    this.initialize();
  }

  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔍 GeoJump: Initializing service components');
      
      // Set up the visualization extension
      await geojumpVisualizationExtension.setup();
      
      // Start periodic scanning for maps
      geojumpMapService.startPeriodicScanning(2000);
      
      this.isInitialized = true;
      console.log('🔍 GeoJump: Service initialization complete');
    } catch (error) {
      console.error('🔍 GeoJump: Error initializing service:', error);
    }
  }

  /**
   * Get the event observable for subscribing to geojump events
   */
  getEvents(): Observable<GeojumpEvent | null> {
    return this.eventSubject.asObservable();
  }

  /**
   * Parse coordinate input string
   */
  parseCoordinates(input: string): GeojumpCoordinates | null {
    return CoordinateParser.parseCoordinates(input);
  }

  /**
   * Format coordinates to a specific format
   */
  formatCoordinates(coordinates: GeojumpCoordinates, format: string): string {
    return CoordinateParser.formatCoordinates(coordinates, format as any);
  }

  /**
   * Jump to specific coordinates on all available maps
   */
  async jumpToCoordinates(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): Promise<boolean> {
    console.log('🔍 GeoJump: Jumping to coordinates:', coordinates, 'with options:', options);

    // Ensure service is initialized
    await this.initialize();

    // Emit event
    this.eventSubject.next({
      type: GEOJUMP_EVENTS.JUMP_TO_COORDINATES,
      payload: { coordinates, options }
    });

    let success = false;

    try {
      // Try the visualization extension first (most reliable)
      success = await geojumpVisualizationExtension.jumpToCoordinates(coordinates, options);
      
      if (success) {
        console.log('🔍 GeoJump: Successfully jumped via visualization extension');
        this.emitJumpSuccess(coordinates, options);
        return true;
      }

      // Try the map service directly
      success = await geojumpMapService.jumpToCoordinates(coordinates, options);
      
      if (success) {
        console.log('🔍 GeoJump: Successfully jumped via map service');
        this.emitJumpSuccess(coordinates, options);
        return true;
      }

      // Try fallback methods
      success = await this.tryFallbackMethods(coordinates, options);
      
      if (success) {
        console.log('🔍 GeoJump: Successfully jumped via fallback methods');
        this.emitJumpSuccess(coordinates, options);
        return true;
      }

      console.log('🔍 GeoJump: All jump methods failed');
      this.emitJumpFailure(coordinates, options, 'No maps found or accessible');
      return false;

    } catch (error) {
      console.error('🔍 GeoJump: Error during jump operation:', error);
      this.emitJumpFailure(coordinates, options, error.message);
      return false;
    }
  }

  /**
   * Try fallback methods when primary methods fail
   */
  private async tryFallbackMethods(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): Promise<boolean> {
    console.log('🔍 GeoJump: Trying fallback methods');

    // Method 1: Try direct Leaflet access
    if (await this.tryDirectLeafletAccess(coordinates, options)) {
      return true;
    }

    // Method 2: Try custom event dispatch
    if (this.tryCustomEventDispatch(coordinates, options)) {
      return true;
    }

    // Method 3: Try URL-based navigation (for some map types)
    if (this.tryUrlBasedNavigation(coordinates, options)) {
      return true;
    }

    return false;
  }

  /**
   * Try direct Leaflet access as fallback
   */
  private async tryDirectLeafletAccess(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): Promise<boolean> {
    console.log('🔍 GeoJump: Trying direct Leaflet access');

    try {
      // Look for Leaflet containers
      const leafletContainers = document.querySelectorAll('.leaflet-container');
      
      if (leafletContainers.length === 0) {
        console.log('🔍 GeoJump: No Leaflet containers found');
        return false;
      }

      let success = false;
      const zoom = coordinates.zoom || options.zoomLevel || 10;

      leafletContainers.forEach((container) => {
        // Try to access the Leaflet map instance
        const leafletMap = (container as any)._leaflet_map;
        
        if (leafletMap && typeof leafletMap.setView === 'function') {
          console.log('🔍 GeoJump: Found Leaflet map, attempting jump');
          try {
            leafletMap.setView([coordinates.lat, coordinates.lon], zoom);
            success = true;
            console.log('🔍 GeoJump: Successfully jumped with direct Leaflet access');
          } catch (error) {
            console.error('🔍 GeoJump: Error with direct Leaflet access:', error);
          }
        }
      });

      return success;
    } catch (error) {
      console.error('🔍 GeoJump: Error in tryDirectLeafletAccess:', error);
      return false;
    }
  }

  /**
   * Try custom event dispatch as fallback
   */
  private tryCustomEventDispatch(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
    console.log('🔍 GeoJump: Trying custom event dispatch');

    try {
      const event = new CustomEvent('geojump', {
        detail: { coordinates, options },
        bubbles: true,
        cancelable: true
      });

      // Dispatch on map containers
      const mapContainers = document.querySelectorAll(
        '.leaflet-container, .mapboxgl-map, .vis-map, .tile-map, .region-map, .visualization'
      );

      let dispatched = false;
      mapContainers.forEach((container) => {
        container.dispatchEvent(event);
        dispatched = true;
      });

      // Also dispatch on document
      document.dispatchEvent(event);
      window.dispatchEvent(event);

      if (dispatched) {
        console.log('🔍 GeoJump: Custom events dispatched');
        return true;
      }

      return false;
    } catch (error) {
      console.error('🔍 GeoJump: Error dispatching custom events:', error);
      return false;
    }
  }

  /**
   * Try URL-based navigation for some map types
   */
  private tryUrlBasedNavigation(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
    console.log('🔍 GeoJump: Trying URL-based navigation');

    try {
      // This is a last resort - modify URL hash or query params
      // Some map applications respond to URL changes
      const zoom = coordinates.zoom || options.zoomLevel || 10;
      const hash = `#map=${zoom}/${coordinates.lat}/${coordinates.lon}`;
      
      // Only modify hash if we're on a page that might respond to it
      if (window.location.pathname.includes('dashboard') || 
          window.location.pathname.includes('visualize') ||
          document.querySelector('.vis-map, .tile-map, .region-map')) {
        
        console.log('🔍 GeoJump: Setting location hash:', hash);
        window.location.hash = hash;
        
        // Also try setting it as a query parameter
        const url = new URL(window.location.href);
        url.searchParams.set('lat', coordinates.lat.toString());
        url.searchParams.set('lon', coordinates.lon.toString());
        url.searchParams.set('zoom', zoom.toString());
        
        // Use history API to avoid page reload
        window.history.replaceState({}, '', url.toString());
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('🔍 GeoJump: Error with URL-based navigation:', error);
      return false;
    }
  }

  /**
   * Get debug information about available maps
   */
  public getDebugInfo(): any {
    const capturedMaps = geojumpMapService.getCapturedMaps();
    
    return {
      capturedMaps: capturedMaps.length,
      mapDetails: capturedMaps.map((map, index) => ({
        index,
        type: map.type,
        timestamp: new Date(map.timestamp).toLocaleTimeString(),
        hasSetCenter: typeof map.instance.setCenter === 'function',
        hasSetZoomLevel: typeof map.instance.setZoomLevel === 'function',
        hasSetView: typeof map.instance.setView === 'function',
        hasLeafletMap: !!map.instance._leafletMap,
        methods: Object.getOwnPropertyNames(map.instance)
          .filter(prop => typeof map.instance[prop] === 'function')
          .slice(0, 5)
      })),
      leafletContainers: document.querySelectorAll('.leaflet-container').length,
      visualizations: document.querySelectorAll('.visualization, .visWrapper, .embPanel').length,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Force a rescan for maps
   */
  public async rescanMaps(): Promise<void> {
    console.log('🔍 GeoJump: Forcing map rescan');
    geojumpMapService.clearCapturedMaps();
    await geojumpVisualizationExtension.setup();
  }

  /**
   * Register a map instance manually
   */
  public registerMap(mapInstance: any, container?: HTMLElement): void {
    console.log('🔍 GeoJump: Manually registering map instance:', mapInstance);
    
    if (container) {
      geojumpMapService.captureMap(mapInstance, container, 'opensearch');
    } else {
      // Try to find a suitable container
      const containers = document.querySelectorAll('.leaflet-container, .vis-map, .visualization');
      if (containers.length > 0) {
        geojumpMapService.captureMap(mapInstance, containers[0] as HTMLElement, 'opensearch');
      }
    }
  }

  /**
   * Emit jump success event
   */
  private emitJumpSuccess(coordinates: GeojumpCoordinates, options: GeojumpOptions): void {
    this.eventSubject.next({
      type: GEOJUMP_EVENTS.JUMP_SUCCESS,
      payload: { coordinates, options }
    });
  }

  /**
   * Emit jump failure event
   */
  private emitJumpFailure(coordinates: GeojumpCoordinates, options: GeojumpOptions, error: string): void {
    this.eventSubject.next({
      type: GEOJUMP_EVENTS.JUMP_FAILURE,
      payload: { coordinates, options, error }
    });
  }

  /**
   * Validate coordinate input
   */
  validateCoordinates(input: string): { isValid: boolean; error?: string } {
    return CoordinateParser.validateInput(input);
  }

  /**
   * Emit format changed event
   */
  emitFormatChanged(format: string): void {
    this.eventSubject.next({
      type: GEOJUMP_EVENTS.FORMAT_CHANGED,
      payload: { format }
    });
  }

  /**
   * Emit coordinates changed event
   */
  emitCoordinatesChanged(coordinates: GeojumpCoordinates): void {
    this.eventSubject.next({
      type: GEOJUMP_EVENTS.COORDINATES_CHANGED,
      payload: { coordinates }
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    console.log('🔍 GeoJump: Destroying GeojumpServiceRefactored');
    this.eventSubject.complete();
    geojumpMapService.destroy();
    this.isInitialized = false;
  }
}
