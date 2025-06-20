import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { GeojumpPluginSetup, GeojumpPluginStart, AppPluginStartDependencies, AppPluginSetupDependencies } from './types';
import { PLUGIN_NAME, GeojumpCoordinates, GeojumpOptions } from '../common';
import { GeojumpServiceRefactored } from './services/geojump_service_refactored';
import { createGeojumpEmbeddable } from './components/geojump_embeddable';
import ReactDOM from 'react-dom';
import React from 'react';
import { GeojumpMapControl } from './components/geojump_map_control';

export class GeojumpPluginRefactored implements Plugin<GeojumpPluginSetup, GeojumpPluginStart> {
  private geojumpService: GeojumpServiceRefactored | null = null;

  public setup(core: CoreSetup, plugins: AppPluginSetupDependencies): GeojumpPluginSetup {
    console.log('🔍 GeoJump: Setting up refactored plugin with mapsLegacy dependency:', plugins.mapsLegacy);
    
    // Register an application into the side navigation menu
    core.application.register({
      id: 'geojump',
      title: PLUGIN_NAME,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    });

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
    console.log('🔍 GeoJump: Starting refactored plugin with mapsLegacy:', plugins.mapsLegacy);
    
    // Initialize the refactored geojump service
    this.geojumpService = new GeojumpServiceRefactored();

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
    console.log('🔍 GeoJump: Setting up map control observer');

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
    // Mark the container to prevent adding multiple controls
    if (mapContainer.hasAttribute('data-geojump-control')) {
      return;
    }
    mapContainer.setAttribute('data-geojump-control', 'true');
    
    console.log('🔍 GeoJump: Adding control to map container:', mapContainer);
    
    // Create a control container
    const controlContainer = document.createElement('div');
    controlContainer.className = 'geojump-map-control-overlay';
    controlContainer.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      pointer-events: none;
    `;
    
    // Make sure the map container has relative positioning
    const computedStyle = window.getComputedStyle(mapContainer);
    if (computedStyle.position === 'static') {
      mapContainer.style.position = 'relative';
    }
    
    mapContainer.appendChild(controlContainer);
    
    // Render the control
    ReactDOM.render(
      React.createElement(GeojumpMapControl, {
        mapContainer,
        position: 'topRight',
        onJump: (coords, opts) => {
          if (this.geojumpService) {
            this.geojumpService.jumpToCoordinates(coords, opts);
          }
        },
      }),
      controlContainer
    );
    
    console.log('🔍 GeoJump: Control added to map container');
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
        console.log('🔍 GeoJump: Maps rescanned');
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
