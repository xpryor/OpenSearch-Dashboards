import { Subject, Observable } from 'rxjs';
import { GeojumpCoordinates, GeojumpOptions, GEOJUMP_EVENTS } from '../../common';
import { CoordinateParser } from '../utils/coordinate_parser';
import { jumpToCoordinatesSimple } from '../utils/simple_map_jump';
import { jumpToCoordinatesUsingOpenSearchMaps } from '../utils/opensearch_map_access';
import { jumpToCoordinatesViaDOMManipulation } from '../utils/direct_map_manipulation';
import { jumpUsingSimpleAPI } from '../utils/simple_api_approach';

export interface GeojumpEvent {
  type: string;
  payload: any;
}

/**
 * Core service for GeoJump functionality
 */
export class GeojumpService {
  private eventSubject = new Subject<GeojumpEvent | null>();
  private mapInstances: any[] = [];

  constructor() {
    console.log('🔍 GeoJump DEBUG: GeojumpService initialized');
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
  async jumpToCoordinates(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): Promise<void> {
    console.log('🔍 GeoJump DEBUG: Jumping to coordinates:', coordinates, 'with options:', options);

    // Emit event
    this.eventSubject.next({
      type: GEOJUMP_EVENTS.JUMP_TO_COORDINATES,
      payload: { coordinates, options }
    });

    // Try the simple API approach first (uses same code as tile_map_visualization.js)
    let success = await jumpUsingSimpleAPI(coordinates, options);
    
    if (!success) {
      console.log('🔍 GeoJump DEBUG: Simple API approach failed, trying other approaches');
      // Try the simple approach (direct Leaflet API access)
      success = jumpToCoordinatesSimple(coordinates, options);
    }
    
    if (!success) {
      console.log('🔍 GeoJump DEBUG: Simple approach failed, trying OpenSearch approach');
      // Try the OpenSearch Dashboards-aware approach
      success = jumpToCoordinatesUsingOpenSearchMaps(coordinates, options);
    }
    
    if (!success) {
      console.log('🔍 GeoJump DEBUG: OpenSearch approach failed, trying DOM manipulation');
      // Try direct DOM manipulation approach
      success = jumpToCoordinatesViaDOMManipulation(coordinates, options);
    }
    
    if (!success) {
      console.log('🔍 GeoJump DEBUG: All approaches failed, trying fallback methods');
      // Fall back to the original approach
      this.findAndManipulateMaps(coordinates, options);
    }
  }

  /**
   * Register a map instance
   */
  registerMap(mapInstance: any): void {
    console.log('🔍 GeoJump DEBUG: Registering map instance:', mapInstance);
    this.mapInstances.push(mapInstance);
  }

  /**
   * Find and manipulate all available maps
   */
  private findAndManipulateMaps(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): void {
    console.log('🔍 GeoJump DEBUG: Finding and manipulating maps');

    let mapManipulated = false;

    // Try registered map instances first
    this.mapInstances.forEach((mapInstance, index) => {
      console.log(`🔍 GeoJump DEBUG: Trying registered map instance ${index}:`, mapInstance);
      if (this.tryManipulateMap(mapInstance, coordinates, options)) {
        mapManipulated = true;
      }
    });

    // Try to find maps in the DOM
    const success = this.findMapsInDOM(coordinates, options);
    if (success) {
      mapManipulated = true;
    }

    // If no maps were manipulated, try a more aggressive approach
    if (!mapManipulated) {
      console.log('🔍 GeoJump DEBUG: No maps manipulated, trying aggressive approach');
      this.tryAggressiveMapSearch(coordinates, options);
    }
  }

  /**
   * Try an aggressive approach to find and manipulate maps
   */
  private tryAggressiveMapSearch(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): void {
    console.log('🔍 GeoJump DEBUG: Starting aggressive map search');

    // Search all DOM elements for map-like objects
    const allElements = document.querySelectorAll('*');
    console.log('🔍 GeoJump DEBUG: Searching through', allElements.length, 'DOM elements');

    let mapsFound = 0;
    
    for (let i = 0; i < allElements.length && mapsFound < 10; i++) { // Limit to prevent performance issues
      const element = allElements[i] as any;
      
      // Check for common map properties
      const mapProps = ['_leaflet_map', '_mapboxMap', '_map', 'map', 'mapInstance', '__map'];
      
      for (const prop of mapProps) {
        if (element[prop] && typeof element[prop] === 'object') {
          const mapObj = element[prop];
          
          // Check if this looks like a map object
          if (typeof mapObj.setView === 'function' || 
              typeof mapObj.flyTo === 'function' || 
              typeof mapObj.setCenter === 'function') {
            
            console.log(`🔍 GeoJump DEBUG: Found potential map object at element[${prop}]:`, mapObj);
            
            if (this.tryManipulateMap(mapObj, coordinates, options)) {
              mapsFound++;
              console.log(`🔍 GeoJump DEBUG: Successfully manipulated map ${mapsFound}`);
            }
          }
        }
      }
    }

    // Try to access global map objects
    const win = window as any;
    const globalMapProps = [
      'map', 'leafletMap', 'mapboxMap', 'visMap', 'tileMap', 'regionMap',
      '__map', '__leafletMap', '__mapboxMap', '__visMap'
    ];

    for (const prop of globalMapProps) {
      if (win[prop] && typeof win[prop] === 'object') {
        console.log(`🔍 GeoJump DEBUG: Found global map object at window.${prop}:`, win[prop]);
        if (this.tryManipulateMap(win[prop], coordinates, options)) {
          console.log(`🔍 GeoJump DEBUG: Successfully manipulated global map ${prop}`);
        }
      }
    }

    // Try to find OpenSearch Dashboards specific objects
    if (win.angular) {
      console.log('🔍 GeoJump DEBUG: Found Angular, searching for OpenSearch Dashboards maps');
      
      // Try to find Angular scopes with map objects
      try {
        const body = document.querySelector('body');
        if (body && (body as any).$$childScope) {
          this.searchAngularScopes((body as any).$$childScope, coordinates, options);
        }
      } catch (error) {
        console.debug('🔍 GeoJump DEBUG: Error searching Angular scopes:', error);
      }
    }

    console.log(`🔍 GeoJump DEBUG: Aggressive search completed, found ${mapsFound} maps`);
  }

  /**
   * Search Angular scopes for map objects (for OpenSearch Dashboards)
   */
  private searchAngularScopes(scope: any, coordinates: GeojumpCoordinates, options: GeojumpOptions, depth = 0): void {
    if (depth > 5) return; // Prevent infinite recursion

    try {
      // Check current scope for map objects
      const mapProps = ['map', 'vis', 'visualization', 'mapHandler', 'leafletMap'];
      
      for (const prop of mapProps) {
        if (scope[prop] && typeof scope[prop] === 'object') {
          console.log(`🔍 GeoJump DEBUG: Found ${prop} in Angular scope:`, scope[prop]);
          
          // Try to access the map
          const mapObj = scope[prop].map || scope[prop]._map || scope[prop];
          
          if (mapObj && (typeof mapObj.setView === 'function' || 
                        typeof mapObj.flyTo === 'function' || 
                        typeof mapObj.setCenter === 'function')) {
            console.log('🔍 GeoJump DEBUG: Found map in Angular scope:', mapObj);
            this.tryManipulateMap(mapObj, coordinates, options);
          }
        }
      }

      // Search child scopes
      if (scope.$$childHead) {
        let child = scope.$$childHead;
        while (child) {
          this.searchAngularScopes(child, coordinates, options, depth + 1);
          child = child.$$nextSibling;
        }
      }
    } catch (error) {
      console.debug('🔍 GeoJump DEBUG: Error in Angular scope search:', error);
    }
  }

  /**
   * Try to manipulate a specific map instance
   */
  private tryManipulateMap(mapInstance: any, coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
    console.log('🔍 GeoJump DEBUG: Trying to manipulate map instance:', mapInstance);

    try {
      // Try Mapbox GL
      if (mapInstance.flyTo || mapInstance.setCenter) {
        console.log('🔍 GeoJump DEBUG: Using Mapbox GL methods');
        if (mapInstance.flyTo) {
          mapInstance.flyTo({
            center: [coordinates.lon, coordinates.lat],
            zoom: coordinates.zoom || options.zoomLevel || 10
          });
        } else if (mapInstance.setCenter) {
          mapInstance.setCenter([coordinates.lon, coordinates.lat]);
          if (mapInstance.setZoom) {
            mapInstance.setZoom(coordinates.zoom || options.zoomLevel || 10);
          }
        }
        return true;
      }

      // Try Leaflet
      if (mapInstance.setView) {
        console.log('🔍 GeoJump DEBUG: Using Leaflet setView method');
        mapInstance.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
        return true;
      }

      // Try OpenLayers
      if (mapInstance.getView && mapInstance.getView().setCenter) {
        console.log('🔍 GeoJump DEBUG: Using OpenLayers methods');
        const view = mapInstance.getView();
        view.setCenter([coordinates.lon, coordinates.lat]);
        view.setZoom(coordinates.zoom || options.zoomLevel || 10);
        return true;
      }

    } catch (error) {
      console.error('🔍 GeoJump DEBUG: Error manipulating map instance:', error);
    }

    return false;
  }

  /**
   * Find maps in the DOM and try to manipulate them
   */
  private findMapsInDOM(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
    console.log('🔍 GeoJump DEBUG: Finding maps in DOM');

    let success = false;

    // Find map containers
    const mapContainers = this.findMapContainers();
    
    mapContainers.forEach((container, index) => {
      console.log(`🔍 GeoJump DEBUG: Processing map container ${index}:`, container);
      
      // Try different map access strategies
      const containerSuccess = this.tryDirectMapboxAccess(container, coordinates, options) ||
                              this.tryDirectLeafletAccess(container, coordinates, options) ||
                              this.tryCustomEventDispatch(container, coordinates, options);
      
      if (containerSuccess) {
        success = true;
        console.log(`🔍 GeoJump DEBUG: Successfully manipulated map in container ${index}`);
      }
    });

    return success;
  }

  /**
   * Find map containers in the DOM
   */
  private findMapContainers(): HTMLElement[] {
    const containers: HTMLElement[] = [];
    
    const selectors = [
      '.mapboxgl-map',
      '.leaflet-container',
      '[data-test-subj*="map"]',
      '.vis-map',
      '.tile-map',
      '.region-map',
      '.embPanel__content [class*="map"]',
      '.visMapChart',
      '.mapContainer',
      '.mapboxgl-canvas-container',
      '.leaflet-map-pane',
      '.embPanel [data-render-complete="true"]',
      '.visWrapper'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          containers.push(el);
        }
      });
    });

    return containers;
  }

  /**
   * Try to directly access a Mapbox GL map
   */
  private tryDirectMapboxAccess(container: HTMLElement, coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
    console.log('🔍 GeoJump DEBUG: Trying direct Mapbox access for container:', container);
    
    try {
      // Try to find the Mapbox map instance
      const mapboxMap = this.findMapboxMap(container);
      
      if (mapboxMap) {
        console.log('🔍 GeoJump DEBUG: Found Mapbox map instance:', mapboxMap);
        
        if (mapboxMap.flyTo) {
          console.log('🔍 GeoJump DEBUG: Using Mapbox flyTo method');
          mapboxMap.flyTo({
            center: [coordinates.lon, coordinates.lat],
            zoom: coordinates.zoom || options.zoomLevel || 10
          });
          return true;
        }
      }
    } catch (error) {
      console.error('🔍 GeoJump DEBUG: Error in tryDirectMapboxAccess:', error);
    }
    
    return false;
  }

  /**
   * Find a Mapbox GL map instance in a container
   */
  private findMapboxMap(container: HTMLElement): any {
    console.log('🔍 GeoJump DEBUG: Finding Mapbox map instance in container:', container);
    
    // Try to access the map through various properties
    const possibleProps = ['_map', '__mapboxgl_map', 'map'];
    
    for (const prop of possibleProps) {
      if ((container as any)[prop]) {
        console.log(`🔍 GeoJump DEBUG: Found Mapbox map via ${prop}:`, (container as any)[prop]);
        return (container as any)[prop];
      }
    }
    
    // Try to find in global mapbox instances
    const win = window as any;
    if (win.__geojump_maps && win.__geojump_maps.length > 0) {
      console.log('🔍 GeoJump DEBUG: Found maps in global __geojump_maps:', win.__geojump_maps);
      return win.__geojump_maps[0];
    }
    
    return null;
  }

  /**
   * Try to dispatch a custom event for unsupported map types
   */
  private tryCustomEventDispatch(container: HTMLElement, coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
    console.log('🔍 GeoJump DEBUG: Dispatching custom geojump event');
    
    try {
      const event = new CustomEvent('geojump', {
        detail: { coordinates, options },
        bubbles: true
      });
      
      container.dispatchEvent(event);
      document.dispatchEvent(event);
      
      return true;
    } catch (error) {
      console.error('🔍 GeoJump DEBUG: Error dispatching custom event:', error);
    }
    
    return false;
  }

  /**
   * Try to directly manipulate a Leaflet map in OpenSearch Dashboards
   */
  private tryDirectLeafletAccess(container: HTMLElement, coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
    console.log('🔍 GeoJump DEBUG: Trying direct Leaflet access for container:', container);
    
    try {
      // Try to find the Leaflet map instance
      const leafletMap = this.findLeafletMap(container);
      
      if (leafletMap) {
        console.log('🔍 GeoJump DEBUG: Found Leaflet map instance:', leafletMap);
        
        // Try to use the map instance
        if (typeof leafletMap.setView === 'function') {
          console.log('🔍 GeoJump DEBUG: Using Leaflet setView method');
          leafletMap.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
          return true;
        }
      } else {
        console.log('🔍 GeoJump DEBUG: No Leaflet map instance found, trying direct DOM manipulation');
        
        // Try direct DOM manipulation for Leaflet maps
        // This is a last resort approach that might work for some Leaflet maps
        
        // Find the map pane
        const mapPane = container.querySelector('.leaflet-map-pane');
        if (mapPane) {
          console.log('🔍 GeoJump DEBUG: Found leaflet-map-pane:', mapPane);
          
          // Try to find the tile layer
          const tileLayer = container.querySelector('.leaflet-tile-pane');
          if (tileLayer) {
            console.log('🔍 GeoJump DEBUG: Found leaflet-tile-pane:', tileLayer);
            
            // Try to inject a script to manipulate the map
            this.injectLeafletScript(coordinates, options);
          }
        }
      }
    } catch (error) {
      console.error('🔍 GeoJump DEBUG: Error in tryDirectLeafletAccess:', error);
    }
    
    return false;
  }
  
  /**
   * Find a Leaflet map instance in a container
   */
  private findLeafletMap(container: HTMLElement): any {
    console.log('🔍 GeoJump DEBUG: Finding Leaflet map instance in container:', container);
    
    // Direct access to _leaflet_map property
    if ((container as any)._leaflet_map) {
      console.log('🔍 GeoJump DEBUG: Found _leaflet_map property:', (container as any)._leaflet_map);
      return (container as any)._leaflet_map;
    }
    
    // Try to find the map instance in the container's children
    const mapPanes = container.querySelectorAll('.leaflet-map-pane');
    if (mapPanes.length > 0) {
      console.log('🔍 GeoJump DEBUG: Found leaflet-map-pane elements:', mapPanes);
      
      // Try to find the map instance in the parent chain
      let element: any = mapPanes[0];
      while (element) {
        if (element._leaflet_map) {
          console.log('🔍 GeoJump DEBUG: Found _leaflet_map in parent chain:', element._leaflet_map);
          return element._leaflet_map;
        }
        element = element.parentElement;
      }
    }
    
    // Try to access the map through the Leaflet global object
    const win = window as any;
    if (win.L && win.L.map && win.L.map._leaflet_id) {
      console.log('🔍 GeoJump DEBUG: Found Leaflet map through global L object:', win.L.map);
      return win.L.map;
    }
    
    // Last resort: try to find any Leaflet map in the DOM
    const allElements = document.querySelectorAll('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i] as any;
      if (el._leaflet_map) {
        console.log('🔍 GeoJump DEBUG: Found _leaflet_map in DOM element:', el, el._leaflet_map);
        return el._leaflet_map;
      }
    }
    
    return null;
  }
  
  /**
   * Inject a script to manipulate a Leaflet map
   */
  private injectLeafletScript(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): void {
    console.log('🔍 GeoJump DEBUG: Injecting Leaflet script');
    
    try {
      // Create a function to find and manipulate Leaflet maps
      const findAndManipulateLeafletMaps = () => {
        console.log('🔍 GeoJump DEBUG: Finding and manipulating Leaflet maps');
        
        // Find all Leaflet containers
        const containers = document.querySelectorAll('.leaflet-container');
        console.log('🔍 GeoJump DEBUG: Found', containers.length, 'Leaflet containers');
        
        // Try to find Leaflet maps
        containers.forEach((container) => {
          // Try to find the map instance
          const map = (container as any)._leaflet_map;
          if (map) {
            console.log('🔍 GeoJump DEBUG: Found Leaflet map:', map);
            
            // Try to use the map
            if (typeof map.setView === 'function') {
              console.log('🔍 GeoJump DEBUG: Using Leaflet setView method');
              map.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
            }
          }
        });
        
        // Try to find Leaflet maps in the window object
        const win = window as any;
        if (win.L && win.L.map) {
          console.log('🔍 GeoJump DEBUG: Found Leaflet map in window.L:', win.L.map);
          
          // Try to use the map
          if (typeof win.L.map.setView === 'function') {
            console.log('🔍 GeoJump DEBUG: Using Leaflet setView method');
            win.L.map.setView([coordinates.lat, coordinates.lon], coordinates.zoom || options.zoomLevel || 10);
          }
        }
      };
      
      // Execute the function
      findAndManipulateLeafletMaps();
    } catch (error) {
      console.error('🔍 GeoJump DEBUG: Error injecting Leaflet script:', error);
    }
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
    console.log('🔍 GeoJump DEBUG: Destroying GeojumpService');
    this.eventSubject.complete();
    this.mapInstances = [];
  }
}
