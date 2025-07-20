/**
 * GeoJump Visualization Extension
 * Extends existing map visualizations to add GeoJump functionality
 */

import { GeojumpCoordinates, GeojumpOptions } from '../../common';
import { geojumpMapService } from './geojump_map_service';

export class GeojumpVisualizationExtension {
  private static instance: GeojumpVisualizationExtension;
  private isSetup = false;

  public static getInstance(): GeojumpVisualizationExtension {
    if (!GeojumpVisualizationExtension.instance) {
      GeojumpVisualizationExtension.instance = new GeojumpVisualizationExtension();
    }
    return GeojumpVisualizationExtension.instance;
  }

  /**
   * Set up the extension to hook into existing visualizations
   */
  public async setup(): Promise<void> {
    if (this.isSetup) return;



    try {
      // Hook into BaseMapsVisualization
      await this.hookIntoBaseMapsVisualization();
      
      // Hook into specific visualization types
      await this.hookIntoTileMapVisualization();
      await this.hookIntoRegionMapVisualization();
      
      this.isSetup = true;
    } catch (error) {
      console.error('🔍 GeoJump: Error setting up visualization extension:', error);
    }
  }

  /**
   * Hook into BaseMapsVisualization to capture all map-based visualizations
   */
  private async hookIntoBaseMapsVisualization(): Promise<void> {
    try {
      // We need to wait for the maps_legacy module to load
      const checkForBaseMapsVisualization = () => {
        // Look for the BaseMapsVisualization in various locations
        const win = window as any;
        
        // Check if it's available in the global scope
        if (win.BaseMapsVisualization) {
          this.extendBaseMapsVisualization(win.BaseMapsVisualization);
          return;
        }
        
        // Check if it's available in the maps legacy modules
        if (win.mapsLegacyModules && win.mapsLegacyModules.BaseMapsVisualization) {
          this.extendBaseMapsVisualization(win.mapsLegacyModules.BaseMapsVisualization);
          return;
        }
        
        // Try again later
        setTimeout(checkForBaseMapsVisualization, 500);
      };
      
      checkForBaseMapsVisualization();
    } catch (error) {
      console.error('🔍 GeoJump: Error hooking into BaseMapsVisualization:', error);
    }
  }

  /**
   * Extend BaseMapsVisualization to capture map instances
   */
  private extendBaseMapsVisualization(BaseMapsVisualizationClass: any): void {
    if (!BaseMapsVisualizationClass || BaseMapsVisualizationClass.__geojumpExtended) {
      return;
    }

    // Store original methods
    const originalMakeOpenSearchDashboardsMap = BaseMapsVisualizationClass.prototype._makeOpenSearchDashboardsMap;
    const originalRender = BaseMapsVisualizationClass.prototype.render;

    // Extend _makeOpenSearchDashboardsMap to capture map instances
    BaseMapsVisualizationClass.prototype._makeOpenSearchDashboardsMap = async function() {
      // Call original method
      const result = await originalMakeOpenSearchDashboardsMap.call(this);
      
      // Capture the map instance
      if (this._opensearchDashboardsMap) {
        geojumpMapService.captureMap(this._opensearchDashboardsMap, this._container, 'opensearch');
        
        // Add GeoJump methods to the visualization instance
        this.jumpToCoordinates = (coordinates: GeojumpCoordinates, options: GeojumpOptions = {}) => {
          return this.geojumpJumpToCoordinates(coordinates, options);
        };
        
        this.geojumpJumpToCoordinates = (coordinates: GeojumpCoordinates, options: GeojumpOptions = {}) => {
          
          const zoom = coordinates.zoom || options.zoomLevel || 10;
          
          try {
            if (this._opensearchDashboardsMap) {
              // Use OpenSearch Dashboards map methods
              this._opensearchDashboardsMap.setCenter(coordinates.lat, coordinates.lon);
              this._opensearchDashboardsMap.setZoomLevel(zoom);
              
              // Trigger resize to ensure proper rendering
              if (typeof this._opensearchDashboardsMap.resize === 'function') {
                this._opensearchDashboardsMap.resize();
              }
              
              // Update UI state if available
              if (this.vis && this.vis.uiStateVal) {
                this.vis.uiStateVal('mapCenter', [coordinates.lat, coordinates.lon]);
                this.vis.uiStateVal('mapZoom', zoom);
              }
              
              return true;
            }
          } catch (error) {
            console.error('🔍 GeoJump: Error in visualization jump method:', error);
          }
          
          return false;
        };
      }
      
      return result;
    };

    // Extend render method to ensure map is available
    BaseMapsVisualizationClass.prototype.render = async function(opensearchResponse: any, visParams: any) {
      // Call original render
      const result = await originalRender.call(this, opensearchResponse, visParams);
      
      // Ensure map is captured after render
      if (this._opensearchDashboardsMap && !geojumpMapService.getCapturedMaps().find(m => m.instance === this._opensearchDashboardsMap)) {
        geojumpMapService.captureMap(this._opensearchDashboardsMap, this._container, 'opensearch');
      }
      
      return result;
    };

    // Mark as extended
    BaseMapsVisualizationClass.__geojumpExtended = true;
  }

  /**
   * Hook into TileMapVisualization specifically
   */
  private async hookIntoTileMapVisualization(): Promise<void> {
    try {
      const checkForTileMapVisualization = () => {
        const win = window as any;
        
        // Look for tile map visualization
        if (win.TileMapVisualization || (win.tileMapVisualization && win.tileMapVisualization.TileMapVisualization)) {
          const TileMapVis = win.TileMapVisualization || win.tileMapVisualization.TileMapVisualization;
          console.log('🔍 GeoJump: Found TileMapVisualization');
          this.extendTileMapVisualization(TileMapVis);
          return;
        }
        
        setTimeout(checkForTileMapVisualization, 500);
      };
      
      checkForTileMapVisualization();
    } catch (error) {
      console.error('🔍 GeoJump: Error hooking into TileMapVisualization:', error);
    }
  }

  /**
   * Extend TileMapVisualization
   */
  private extendTileMapVisualization(TileMapVisualizationClass: any): void {
    if (!TileMapVisualizationClass || TileMapVisualizationClass.__geojumpExtended) {
      return;
    }

    console.log('🔍 GeoJump: Extending TileMapVisualization');

    // Store original updateGeohashAgg method
    const originalUpdateGeohashAgg = TileMapVisualizationClass.prototype.updateGeohashAgg;

    // Extend updateGeohashAgg to add GeoJump functionality
    TileMapVisualizationClass.prototype.updateGeohashAgg = function() {
      console.log('🔍 GeoJump: Intercepted updateGeohashAgg call');
      
      // Call original method
      if (originalUpdateGeohashAgg) {
        originalUpdateGeohashAgg.call(this);
      }
      
      // Ensure map is captured
      if (this._opensearchDashboardsMap) {
        geojumpMapService.captureMap(this._opensearchDashboardsMap, this._container, 'opensearch');
      }
    };

    TileMapVisualizationClass.__geojumpExtended = true;
    console.log('🔍 GeoJump: TileMapVisualization extension complete');
  }

  /**
   * Hook into RegionMapVisualization specifically
   */
  private async hookIntoRegionMapVisualization(): Promise<void> {
    try {
      const checkForRegionMapVisualization = () => {
        const win = window as any;
        
        // Look for region map visualization
        if (win.RegionMapVisualization || (win.regionMapVisualization && win.regionMapVisualization.RegionMapVisualization)) {
          const RegionMapVis = win.RegionMapVisualization || win.regionMapVisualization.RegionMapVisualization;
          console.log('🔍 GeoJump: Found RegionMapVisualization');
          this.extendRegionMapVisualization(RegionMapVis);
          return;
        }
        
        setTimeout(checkForRegionMapVisualization, 500);
      };
      
      checkForRegionMapVisualization();
    } catch (error) {
      console.error('🔍 GeoJump: Error hooking into RegionMapVisualization:', error);
    }
  }

  /**
   * Extend RegionMapVisualization
   */
  private extendRegionMapVisualization(RegionMapVisualizationClass: any): void {
    if (!RegionMapVisualizationClass || RegionMapVisualizationClass.__geojumpExtended) {
      return;
    }

    console.log('🔍 GeoJump: Extending RegionMapVisualization');

    // Similar extension as TileMapVisualization
    const originalRender = RegionMapVisualizationClass.prototype.render;

    RegionMapVisualizationClass.prototype.render = async function(opensearchResponse: any, visParams: any) {
      console.log('🔍 GeoJump: Intercepted RegionMapVisualization render call');
      
      const result = await originalRender.call(this, opensearchResponse, visParams);
      
      if (this._opensearchDashboardsMap) {
        geojumpMapService.captureMap(this._opensearchDashboardsMap, this._container, 'opensearch');
      }
      
      return result;
    };

    RegionMapVisualizationClass.__geojumpExtended = true;
    console.log('🔍 GeoJump: RegionMapVisualization extension complete');
  }

  /**
   * Jump to coordinates using any available visualization
   */
  public async jumpToCoordinates(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): Promise<boolean> {
    console.log('🔍 GeoJump: Jumping to coordinates via visualization extension');
    
    // Try using the map service first
    const success = await geojumpMapService.jumpToCoordinates(coordinates, options);
    
    if (success) {
      console.log('🔍 GeoJump: Successfully jumped via map service');
      return true;
    }
    
    // Try to find visualization instances directly
    return this.jumpViaVisualizationInstances(coordinates, options);
  }

  /**
   * Jump via visualization instances found in the DOM
   */
  private jumpViaVisualizationInstances(coordinates: GeojumpCoordinates, options: GeojumpOptions = {}): boolean {
    console.log('🔍 GeoJump: Trying to jump via visualization instances');
    
    let success = false;
    
    // Look for visualization elements
    const visElements = document.querySelectorAll('.visualization, .visWrapper, .embPanel');
    
    visElements.forEach((element) => {
      const reactProps = [
        '__reactInternalInstance$3cyekfou8qi',
        '__reactInternalInstance',
        '__reactFiber$3cyekfou8qi',
        '__reactFiber',
      ];
      
      for (const prop of reactProps) {
        const reactInstance = (element as any)[prop];
        if (reactInstance && reactInstance.stateNode) {
          const stateNode = reactInstance.stateNode;
          
          // Check if this is a map visualization with our extended methods
          if (stateNode.jumpToCoordinates && typeof stateNode.jumpToCoordinates === 'function') {
            console.log('🔍 GeoJump: Found visualization with jumpToCoordinates method');
            try {
              if (stateNode.jumpToCoordinates(coordinates, options)) {
                success = true;
                console.log('🔍 GeoJump: Successfully jumped via visualization instance');
              }
            } catch (error) {
              console.error('🔍 GeoJump: Error jumping via visualization instance:', error);
            }
          }
        }
      }
    });
    
    return success;
  }
}

// Export singleton instance
export const geojumpVisualizationExtension = GeojumpVisualizationExtension.getInstance();
