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

    // Also check for existing maps
    setTimeout(() => {
      const mapContainers = this.findMapContainers(document.body);
      mapContainers.forEach((container) => {
        this.addControlToMap(container);
      });
    }, 1000);
  }

  private findMapContainers(rootElement: HTMLElement): HTMLElement[] {
    const containers: HTMLElement[] = [];
    
    // Look for common map container selectors
    const selectors = [
      '.mapboxgl-map',
      '.leaflet-container',
      '[data-test-subj*="map"]',
      '.vis-map',
      '.tile-map',
      '.region-map',
      '.embPanel__content [class*="map"]',
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

  private findAndAddControlsToMaps(rootElement: HTMLElement) {
    // Check if the element itself is a map container
    const mapSelectors = [
      '.mapboxgl-map',
      '.leaflet-container',
      '[data-test-subj*="map"]',
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

  private addControlToMap(mapContainer: HTMLElement) {
    // Mark the container to prevent adding multiple controls
    mapContainer.setAttribute('data-geojump-control', 'true');
    
    // Create a control container
    const controlContainer = document.createElement('div');
    mapContainer.appendChild(controlContainer);
    
    // Render the control
    ReactDOM.render(
      React.createElement(GeojumpMapControl, {
        mapContainer,
        position: 'topRight',
      }),
      controlContainer
    );
  }
