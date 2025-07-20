/**
 * GeoJump Map Service - Proper integration with OpenSearch Dashboards maps
 * This service hooks into the maps_legacy system to access OpenSearchDashboardsMap instances
 */

import { GeojumpCoordinates, GeojumpOptions } from '../../common';
import { lazyLoadMapsLegacyModules } from '../../../maps_legacy/public';

interface CapturedMap {
  instance: any;
  container: HTMLElement;
  timestamp: number;
  type: 'opensearch' | 'leaflet';
}

export class GeojumpMapService {
  private capturedMaps: CapturedMap[] = [];
  private originalOpenSearchDashboardsMap: any = null;
  private isInterceptorSetup = false;

  constructor() {
    this.setupMapInterceptor();
  }

  /**
   * Set up interceptor to capture OpenSearchDashboardsMap instances as they're created
   */
  private async setupMapInterceptor(): Promise<void> {
    if (this.isInterceptorSetup) return;
    
    try {
      // Load the maps legacy modules to get access to OpenSearchDashboardsMap
      const modules = await lazyLoadMapsLegacyModules();
      
      if (modules.OpenSearchDashboardsMap && !this.originalOpenSearchDashboardsMap) {
        // Store the original constructor
        this.originalOpenSearchDashboardsMap = modules.OpenSearchDashboardsMap;
        
        // Create intercepted constructor
        const self = this;
        function InterceptedOpenSearchDashboardsMap(containerNode: HTMLElement, options: any) {
          // Call original constructor
          const instance = new self.originalOpenSearchDashboardsMap(containerNode, options);
          
          // Capture the instance
          self.captureMap(instance, containerNode, 'opensearch');
          
          return instance;
        }
        
        // Copy prototype and static properties
        InterceptedOpenSearchDashboardsMap.prototype = this.originalOpenSearchDashboardsMap.prototype;
        Object.setPrototypeOf(InterceptedOpenSearchDashboardsMap, this.originalOpenSearchDashboardsMap);
        
        // Replace the constructor in the modules
        modules.OpenSearchDashboardsMap = InterceptedOpenSearchDashboardsMap;
        
        // Also replace in global scope if it exists
        if ((window as any).OpenSearchDashboardsMap) {
          (window as any).OpenSearchDashboardsMap = InterceptedOpenSearchDashboardsMap;
        }
        
        this.isInterceptorSetup = true;
      }
    } catch (error) {
      console.error('🔍 GeoJump: Error setting up map interceptor:', error);
    }
    
    // Note: Removed automatic scanning for performance - maps will be scanned on-demand
  }

  /**
   * Capture a map instance
   */
  public captureMap(instance: any, container: HTMLElement, type: 'opensearch' | 'leaflet'): void {
    // Check if we already have this instance
    const existing = this.capturedMaps.find(m => m.instance === instance);
    if (existing) return;
    
    const capturedMap: CapturedMap = {
      instance,
      container,
      timestamp: Date.now(),
      type
    };
    
    this.capturedMaps.push(capturedMap);
  }

  /**
   * Scan for existing maps in the DOM
   */
  private scanForExistingMaps(): void {
    
    // Look for visualization elements that might contain maps
    const visElements = document.querySelectorAll(
      '.visualization, .visWrapper, .embPanel, [data-test-subj="embeddablePanel"]'
    );
    
    visElements.forEach((element) => {
      this.scanElementForMaps(element as HTMLElement);
    });
    
    // Also look for direct map containers
    const mapContainers = document.querySelectorAll(
      '.leaflet-container, .mapboxgl-map, .vis-map, .tile-map, .region-map'
    );
    
    mapContainers.forEach((container) => {
      this.scanContainerForMaps(container as HTMLElement);
    });
  }

  /**
   * Scan a visualization element for map instances
   */
  private scanElementForMaps(element: HTMLElement): void {
    // Try to access React component instances
    const reactProps = [
      '__reactInternalInstance$3cyekfou8qi',
      '__reactInternalInstance',
      '__reactFiber$3cyekfou8qi',
      '__reactFiber',
    ];
    
    for (const prop of reactProps) {
      const reactInstance = (element as any)[prop];
      if (reactInstance) {
        this.searchReactTreeForMaps(reactInstance);
      }
    }
  }

  /**
   * Search React component tree for map instances
   */
  private searchReactTreeForMaps(instance: any, depth = 0): void {
    if (depth > 10) return; // Prevent infinite recursion
    
    try {
      // Check stateNode for visualization instances
      if (instance.stateNode) {
        const stateNode = instance.stateNode;
        
        // Look for _opensearchDashboardsMap property (this is the key property!)
        if (stateNode._opensearchDashboardsMap) {
          this.captureMap(stateNode._opensearchDashboardsMap, instance.stateNode, 'opensearch');
        }
        
        // Also check for other map-related properties
        const mapProps = ['map', '_map', 'opensearchDashboardsMap', 'mapInstance'];
        for (const mapProp of mapProps) {
          if (stateNode[mapProp] && typeof stateNode[mapProp] === 'object') {
            const mapObj = stateNode[mapProp];
            if (this.isValidMapInstance(mapObj)) {
              this.captureMap(mapObj, instance.stateNode, 'opensearch');
            }
          }
        }
      }
      
      // Search children
      if (instance.child) {
        this.searchReactTreeForMaps(instance.child, depth + 1);
      }
      
      // Search siblings
      if (instance.sibling) {
        this.searchReactTreeForMaps(instance.sibling, depth + 1);
      }
      
    } catch (error) {
      // Continue searching
    }
  }

  /**
   * Scan a container for map instances
   */
  private scanContainerForMaps(container: HTMLElement): void {
    // Check for Leaflet map
    if ((container as any)._leaflet_map) {
      this.captureMap((container as any)._leaflet_map, container, 'leaflet');
    }
    
    // Check for other map properties
    const mapProps = ['_map', '__map', 'map', 'mapInstance'];
    for (const prop of mapProps) {
      if ((container as any)[prop] && this.isValidMapInstance((container as any)[prop])) {
        this.captureMap((container as any)[prop], container, 'opensearch');
      }
    }
  }

  /**
   * Check if an object is a valid map instance
   */
  private isValidMapInstance(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    // Check for OpenSearch Dashboards map methods
    if (typeof obj.setCenter === 'function' && typeof obj.setZoomLevel === 'function') {
      return true;
    }
    
    // Check for Leaflet map methods
    if (typeof obj.setView === 'function' && obj._leafletMap) {
      return true;
    }
    
    // Check for direct Leaflet map
    if (typeof obj.setView === 'function' && obj._container) {
      return true;
    }
    
    return false;
  }

  /**
   * Jump to coordinates using captured maps
   */
  public async jumpToCoordinates(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): Promise<boolean> {
    // Ensure interceptor is set up
    if (!this.isInterceptorSetup) {
      await this.setupMapInterceptor();
    }
    
    // Note: Removed automatic scanning for performance - rely on interceptor to capture maps
    
    if (this.capturedMaps.length === 0) {
      return false;
    }
    
    let success = false;
    
    for (const mapData of this.capturedMaps) {
      try {
        if (await this.jumpWithMapInstance(mapData, coordinates, options)) {
          success = true;
        }
      } catch (error) {
        console.error(`🔍 GeoJump: Error jumping with ${mapData.type} map:`, error);
      }
    }
    
    return success;
  }

  /**
   * Jump to coordinates using a specific map instance
   */
  private async jumpWithMapInstance(
    mapData: CapturedMap, 
    coordinates: GeojumpCoordinates, 
    options: GeojumpOptions
  ): Promise<boolean> {
    const { instance, type } = mapData;
    const zoom = coordinates.zoom || options.zoomLevel || 10;
    
    if (type === 'opensearch') {
      // Try OpenSearch Dashboards map methods
      if (typeof instance.setCenter === 'function' && typeof instance.setZoomLevel === 'function') {
        // Check map's zoom limits to avoid disabling zoom controls
        let validZoom = zoom;
        if (typeof instance.getMinZoom === 'function' && typeof instance.getMaxZoom === 'function') {
          const minZoom = instance.getMinZoom();
          const maxZoom = instance.getMaxZoom();
          validZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
        }
        
        // Try using setView if available (combines center and zoom in one operation)
        if (typeof instance.setView === 'function') {
          instance.setView([coordinates.lat, coordinates.lon], validZoom);
        } else {
          // Otherwise use the order that worked for location (zoom first, then center)
          instance.setZoomLevel(validZoom);
          instance.setCenter(coordinates.lat, coordinates.lon);
        }
        
        // Force a map refresh if available, but with a small delay
        if (typeof instance.resize === 'function') {
          setTimeout(() => {
            instance.resize();
          }, 50);
        }
        
        // Force map refresh and tile reload
        await this.refreshMapTiles(instance);
        
        return true;
      }
      
      // Try underlying Leaflet map
      if (instance._leafletMap && typeof instance._leafletMap.setView === 'function') {
        instance._leafletMap.setView([coordinates.lat, coordinates.lon], zoom);
        
        // Force Leaflet map refresh
        await this.refreshLeafletMap(instance._leafletMap);
        
        return true;
      }
    }
    
    if (type === 'leaflet') {
      // Try direct Leaflet methods
      if (typeof instance.setView === 'function') {
        instance.setView([coordinates.lat, coordinates.lon], zoom);
        
        // Force Leaflet map refresh
        await this.refreshLeafletMap(instance);
        
        return true;
      }
    }
    
    // Try generic map methods (Mapbox style - lon, lat)
    if (typeof instance.flyTo === 'function') {
      instance.flyTo({
        center: [coordinates.lon, coordinates.lat], // Mapbox expects [lon, lat]
        zoom: zoom
      });
      return true;
    }
    
    return false;
  }

  /**
   * Refresh OpenSearch Dashboards map tiles
   */
  private async refreshMapTiles(mapInstance: any): Promise<void> {
    try {
      // Trigger resize to ensure proper rendering
      if (typeof mapInstance.resize === 'function') {
        mapInstance.resize();
      }
      
      // If there's an underlying Leaflet map, refresh it too
      if (mapInstance._leafletMap) {
        await this.refreshLeafletMap(mapInstance._leafletMap);
      }
      
      // Small delay to allow tiles to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('🔍 GeoJump: Error refreshing map tiles:', error);
    }
  }

  /**
   * Refresh Leaflet map tiles
   */
  private async refreshLeafletMap(leafletMap: any): Promise<void> {
    try {
      // Invalidate size to trigger redraw
      if (typeof leafletMap.invalidateSize === 'function') {
        leafletMap.invalidateSize();
      }
      
      // Force tile layer refresh
      leafletMap.eachLayer((layer: any) => {
        if (layer._url && typeof layer.redraw === 'function') {
          layer.redraw();
        }
      });
      
      // Trigger a pan event to force tile loading
      if (typeof leafletMap.panBy === 'function') {
        leafletMap.panBy([0, 0]);
      }
      
      // Small delay to allow tiles to load
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error('🔍 GeoJump: Error refreshing Leaflet map:', error);
    }
  }

  /**
   * Get all captured maps
   */
  public getCapturedMaps(): CapturedMap[] {
    return [...this.capturedMaps];
  }

  /**
   * Clear captured maps (useful for cleanup)
   */
  public clearCapturedMaps(): void {
    this.capturedMaps = [];
  }

  /**
   * Start periodic scanning for new maps (REMOVED for performance)
   * Maps are now captured via interceptor only
   */
  public startPeriodicScanning(intervalMs = 2000): void {
    // Method intentionally disabled to prevent performance issues
  }

  /**
   * Destroy the service
   */
  public destroy(): void {
    this.capturedMaps = [];
    this.isInterceptorSetup = false;
  }
}

// Export singleton instance
export const geojumpMapService = new GeojumpMapService();
