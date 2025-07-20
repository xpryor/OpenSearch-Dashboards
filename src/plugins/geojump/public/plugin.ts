import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { GeojumpPluginSetup, GeojumpPluginStart, AppPluginStartDependencies, AppPluginSetupDependencies } from './types';
import { PLUGIN_NAME, GeojumpCoordinates, GeojumpOptions } from '../common';
import { GeojumpService } from './services/geojump_service';
import { createGeojumpEmbeddable } from './components/geojump_embeddable';
import ReactDOM from 'react-dom';
import React from 'react';
import { GeojumpMapControl } from './components/geojump_map_control';

export class GeojumpPlugin implements Plugin<GeojumpPluginSetup, GeojumpPluginStart> {
  private geojumpService: GeojumpService | null = null;

  public setup(core: CoreSetup, plugins: AppPluginSetupDependencies): GeojumpPluginSetup {

    // Note: Admin panel application registration removed as it provided no benefit

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('geojump.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart, plugins: AppPluginStartDependencies): GeojumpPluginStart {

    // Initialize the geojump service
    this.geojumpService = new GeojumpService();

    // Add GeoJump controls to existing maps (simplified approach)
    this.addGeojumpControlsToMaps();

    // Return public API for other plugins to use
    return {
      jumpToCoordinates: async (coordinates: GeojumpCoordinates, options?: GeojumpOptions) => {
        if (this.geojumpService) {
          return await this.geojumpService.jumpToCoordinates(coordinates, options);
        }
        return false;
      },
      parseCoordinates: (input: string): GeojumpCoordinates | null => {
        if (this.geojumpService) {
          return this.geojumpService.parseCoordinates(input);
        }
        return null;
      },
      formatCoordinates: (coordinates: GeojumpCoordinates, format: string): string => {
        if (this.geojumpService) {
          return this.geojumpService.formatCoordinates(coordinates, format);
        }
        return '';
      },
      createEmbeddable: (container: HTMLElement, options: any = {}) => {
        return createGeojumpEmbeddable({
          container,
          compact: options.compact || false,
          onJump: options.onJump || ((coords, opts) => {
            if (this.geojumpService) {
              this.geojumpService.jumpToCoordinates(coords, opts);
            }
          }),
        });
      },
      addMapControl: (mapContainer: HTMLElement, options: any = {}) => {
        const controlContainer = document.createElement('div');
        controlContainer.className = 'geojump-map-control-container';
        mapContainer.appendChild(controlContainer);

        ReactDOM.render(
          React.createElement(GeojumpMapControl, {
            mapContainer,
            position: options.position || 'topRight',
            onJump: options.onJump || ((coords, opts) => {
              if (this.geojumpService) {
                this.geojumpService.jumpToCoordinates(coords, opts);
              }
            }),
          }),
          controlContainer
        );

        return {
          destroy: () => {
            ReactDOM.unmountComponentAtNode(controlContainer);
            if (controlContainer.parentNode) {
              controlContainer.parentNode.removeChild(controlContainer);
            }
          }
        };
      },
      getDebugInfo: () => {
        if (this.geojumpService) {
          return this.geojumpService.getDebugInfo();
        }
        return { error: 'Service not initialized' };
      },
      rescanMaps: async () => {
        if (this.geojumpService) {
          await this.geojumpService.rescanMaps();
        }
      },
      registerMap: (mapInstance: any, container?: HTMLElement) => {
        if (this.geojumpService) {
          this.geojumpService.registerMap(mapInstance, container);
        }
      }
    };
  }

  public stop() {
    if (this.geojumpService) {
      this.geojumpService.destroy();
      this.geojumpService = null;
    }
  }

  /**
   * Add GeoJump controls to existing maps (simplified approach)
   */
  private addGeojumpControlsToMaps() {

    // Use MutationObserver to detect when map elements are added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              // Look for map containers
              this.findAndAddControlsToMaps(node);

              // Also search within the added node
              const mapContainers = this.findMapContainers(node);
              mapContainers.forEach((container) => {
                this.addControlToMap(container);
              });
            }
          });
        }
      });
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also check for existing maps after a delay
    setTimeout(() => {
      const mapContainers = this.findMapContainers(document.body);
      mapContainers.forEach((container) => {
        this.addControlToMap(container);
      });
    }, 2000);

    // Additional check with longer delay for slow-loading maps
    setTimeout(() => {
      const mapContainers = this.findMapContainers(document.body);
      mapContainers.forEach((container) => {
        if (!container.hasAttribute('data-geojump-control')) {
          this.addControlToMap(container);
        }
      });
    }, 5000);
  }

  /**
   * Find map containers in the DOM
   */
  private findMapContainers(rootElement: HTMLElement): HTMLElement[] {
    const containers: HTMLElement[] = [];

    // Look for common map container selectors
    const selectors = [
      '.leaflet-container',
      '.mapboxgl-map',
      '.vis-map',
      '.tile-map',
      '.region-map',
      '.visMapChart',
      '.mapContainer',
      // Dashboard specific selectors
      '.embPanel [data-render-complete="true"]',
      '.visWrapper',
    ];

    selectors.forEach(selector => {
      const elements = rootElement.querySelectorAll(selector);
      elements.forEach(el => {
        if (el instanceof HTMLElement && !el.hasAttribute('data-geojump-control')) {
          containers.push(el);
        }
      });
    });

    return containers;
  }

  /**
   * Find and add controls to maps in a root element
   */
  private findAndAddControlsToMaps(rootElement: HTMLElement) {
    // Check if the element itself is a map container
    const mapSelectors = [
      '.leaflet-container',
      '.mapboxgl-map',
      '.vis-map',
      '.tile-map',
      '.region-map',
    ];

    for (const selector of mapSelectors) {
      if (rootElement.matches(selector) && !rootElement.hasAttribute('data-geojump-control')) {
        this.addControlToMap(rootElement);
        break;
      }
    }
  }

  /**
   * Add a GeoJump control to a specific map container
   */
  private addControlToMap(mapContainer: HTMLElement) {
    // Check for existing controls more thoroughly
    if (mapContainer.hasAttribute('data-geojump-control') ||
      mapContainer.querySelector('.geojump-map-control-overlay')) {
      return;
    }

    // Clean up any existing controls that might not have been detected
    const existingControls = mapContainer.querySelectorAll('.geojump-map-control-overlay');
    existingControls.forEach(control => {
      ReactDOM.unmountComponentAtNode(control);
      control.remove();
    });

    mapContainer.setAttribute('data-geojump-control', 'true');

    // Create a control container
    const controlContainer = document.createElement('div');
    controlContainer.className = 'geojump-map-control-overlay';
    controlContainer.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      pointer-events: auto;
    `;

    // Make sure the map container has relative positioning
    const computedStyle = window.getComputedStyle(mapContainer);
    if (computedStyle.position === 'static') {
      mapContainer.style.position = 'relative';
    }

    mapContainer.appendChild(controlContainer);

    // Render the control with a map-specific jump function
    ReactDOM.render(
      React.createElement(GeojumpMapControl, {
        mapContainer,
        position: 'topRight',
        onJump: (coords, opts) => {
          // Only jump on THIS specific map, not all maps
          this.jumpToCoordinatesOnSpecificMap(mapContainer, coords, opts);
        },
      }),
      controlContainer
    );


  }

  /**
   * Jump to coordinates on a specific map only (not all maps)
   */
  private async jumpToCoordinatesOnSpecificMap(
    mapContainer: HTMLElement,
    coordinates: GeojumpCoordinates,
    options: GeojumpOptions = {}
  ): Promise<boolean> {
    const zoom = coordinates.zoom || options.zoomLevel || 10;

    // Try to find and manipulate only the map in this specific container

    // Method 1: Try to find Leaflet map in this container
    const leafletContainer = mapContainer.querySelector('.leaflet-container');
    if (leafletContainer) {
      const leafletMap = (leafletContainer as any)._leaflet_map;
      if (leafletMap && typeof leafletMap.setView === 'function') {
        try {
          leafletMap.setView([coordinates.lat, coordinates.lon], zoom);
          return true;
        } catch (error) {
          console.error('🔍 GeoJump: Error jumping with Leaflet map:', error);
        }
      }
    }

    // Method 1b: Try to find Leaflet map in parent containers
    let currentElement = mapContainer.parentElement;
    while (currentElement && currentElement !== document.body) {
      const leafletInParent = currentElement.querySelector('.leaflet-container');
      if (leafletInParent) {
        const leafletMap = (leafletInParent as any)._leaflet_map;
        if (leafletMap && typeof leafletMap.setView === 'function') {
          try {
            leafletMap.setView([coordinates.lat, coordinates.lon], zoom);

            // Verify the jump actually worked by checking the map center
            const center = leafletMap.getCenter();
            const currentZoom = leafletMap.getZoom();

            // Check if we're close to the target coordinates (within reasonable tolerance)
            const latDiff = Math.abs(center.lat - coordinates.lat);
            const lonDiff = Math.abs(center.lng - coordinates.lon);
            const zoomDiff = Math.abs(currentZoom - zoom);

            if (latDiff < 0.1 && lonDiff < 0.1 && zoomDiff < 1) {
              return true;
            } else {
              return false;
            }
          } catch (error) {
            console.error('🔍 GeoJump: Error jumping with parent Leaflet map:', error);
            return false;
          }
        }
      }
      currentElement = currentElement.parentElement;
    }

    // Method 2: Try to find OpenSearch Dashboards map in this container
    // Look for visualization elements that might contain maps
    const visElements = mapContainer.querySelectorAll('.visualization, .visWrapper, .embPanel');
    for (const element of visElements) {
      const reactProps = [
        '__reactInternalInstance$3cyekfou8qi',
        '__reactInternalInstance',
        '__reactFiber$3cyekfou8qi',
        '__reactFiber',
      ];

      for (const prop of reactProps) {
        const reactInstance = (element as any)[prop];
        if (reactInstance) {
          const mapInstance = this.findMapInReactTree(reactInstance);
          if (mapInstance) {
            try {
              if (typeof mapInstance.setCenter === 'function' && typeof mapInstance.setZoomLevel === 'function') {
                mapInstance.setCenter(coordinates.lat, coordinates.lon);
                mapInstance.setZoomLevel(zoom);
                return true;
              }
            } catch (error) {
              console.error('🔍 GeoJump: Error jumping with OpenSearch map:', error);
            }
          }
        }
      }
    }

    // Method 3: Try to find captured maps that belong to this specific container
    if (this.geojumpService) {
      // Get the captured maps from the map service
      const { geojumpMapService } = await import('./map_integration/geojump_map_service');
      const capturedMaps = geojumpMapService.getCapturedMaps();

      // Try to find a captured map that belongs to this container
      for (let i = 0; i < capturedMaps.length; i++) {
        const capturedMap = capturedMaps[i];

        // Check if this captured map's container is within our mapContainer or vice versa
        const isContained = mapContainer.contains(capturedMap.container) ||
          capturedMap.container.contains(mapContainer) ||
          capturedMap.container === mapContainer;

        if (isContained) {
          // Jump only on this specific map instance
          const mapInstance = capturedMap.instance;
          try {
            if (typeof mapInstance.setCenter === 'function' && typeof mapInstance.setZoomLevel === 'function') {
              // Check map's zoom limits to avoid disabling zoom controls
              let validZoom = zoom;
              if (typeof mapInstance.getMinZoom === 'function' && typeof mapInstance.getMaxZoom === 'function') {
                const minZoom = mapInstance.getMinZoom();
                const maxZoom = mapInstance.getMaxZoom();
                validZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
              }

              // Set zoom first, then center (this order prevents the ocean bug)
              mapInstance.setZoomLevel(validZoom);
              mapInstance.setCenter(coordinates.lat, coordinates.lon);

              // Force a map refresh if available
              if (typeof mapInstance.resize === 'function') {
                mapInstance.resize();
              }

              return true;
            } else if (typeof mapInstance.setView === 'function') {
              mapInstance.setView([coordinates.lat, coordinates.lon], zoom);
              return true;
            }
          } catch (error) {
            console.error('🔍 GeoJump: Error jumping with captured map:', error);
          }
        }
      }
    }

    return false;
  }

  /**
   * Search React component tree for map instances
   */
  private findMapInReactTree(instance: any, depth = 0): any {
    if (depth > 10) return null; // Prevent infinite recursion

    try {
      // Check stateNode for visualization instances
      if (instance.stateNode) {
        const stateNode = instance.stateNode;

        // Look for _opensearchDashboardsMap property
        if (stateNode._opensearchDashboardsMap) {
          return stateNode._opensearchDashboardsMap;
        }

        // Also check for other map-related properties
        const mapProps = ['map', '_map', 'opensearchDashboardsMap', 'mapInstance'];
        for (const mapProp of mapProps) {
          if (stateNode[mapProp] && typeof stateNode[mapProp] === 'object') {
            const mapObj = stateNode[mapProp];
            if (this.isValidMapInstance(mapObj)) {
              return mapObj;
            }
          }
        }
      }

      // Search children
      if (instance.child) {
        const childResult = this.findMapInReactTree(instance.child, depth + 1);
        if (childResult) return childResult;
      }

      // Search siblings
      if (instance.sibling) {
        const siblingResult = this.findMapInReactTree(instance.sibling, depth + 1);
        if (siblingResult) return siblingResult;
      }

    } catch (error) {
      // Continue searching
    }

    return null;
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
}

// Debug functions for development
if (typeof window !== 'undefined') {
  (window as any).geojumpDebug = {
    getDebugInfo: () => {
      const plugin = (window as any).__geojumpPlugin;
      if (plugin && plugin.getDebugInfo) {
        return plugin.getDebugInfo();
      }
      return { error: 'Plugin not available' };
    },
    rescanMaps: async () => {
      const plugin = (window as any).__geojumpPlugin;
      if (plugin && plugin.rescanMaps) {
        await plugin.rescanMaps();

      }
    },
    jumpTo: async (lat: number, lon: number, zoom?: number) => {
      const plugin = (window as any).__geojumpPlugin;
      if (plugin && plugin.jumpToCoordinates) {
        return await plugin.jumpToCoordinates({ lat, lon, zoom });
      }
      return false;
    }
  };
}