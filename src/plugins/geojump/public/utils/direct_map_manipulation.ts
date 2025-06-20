/**
 * Direct Map Manipulation via DOM Transform
 * 
 * Since we can see the map pane transform changes when the map moves,
 * we can directly manipulate the map by calculating and setting the transform values.
 */

import { GeojumpCoordinates, GeojumpOptions } from '../../common';

// Add a function to the global scope for testing
(window as any).directMapJump = function(lat: number = 40.7128, lon: number = -74.0060, zoom: number = 12) {
  console.log('🔍 GeoJump DEBUG: Direct map jump with coordinates:', lat, lon, zoom);
  
  // Find the map pane element
  const mapPane = document.querySelector('.leaflet-pane.leaflet-map-pane') as HTMLElement;
  if (!mapPane) {
    console.log('🔍 GeoJump DEBUG: No map pane found');
    return false;
  }
  
  console.log('🔍 GeoJump DEBUG: Found map pane:', mapPane);
  console.log('🔍 GeoJump DEBUG: Current transform:', mapPane.style.transform);
  
  // Get the map container
  const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
  if (!mapContainer) {
    console.log('🔍 GeoJump DEBUG: No map container found');
    return false;
  }
  
  // Get current zoom level from tiles
  let currentZoom = 2; // Default
  const tileImages = mapContainer.querySelectorAll('.leaflet-tile');
  if (tileImages.length > 0) {
    const firstTile = tileImages[0] as HTMLImageElement;
    const tileUrlMatch = firstTile.src.match(/\/(\d+)\/\d+\/\d+\.png/);
    if (tileUrlMatch) {
      currentZoom = parseInt(tileUrlMatch[1]);
      console.log('🔍 GeoJump DEBUG: Detected current zoom from tiles:', currentZoom);
    }
  }
  
  // SIMPLIFIED APPROACH: Use a much simpler pixel-per-degree calculation
  // At zoom level 2, the world is 1024x1024 pixels (256 * 2^2)
  // At zoom level n, the world is (256 * 2^n) pixels
  
  const worldSize = 256 * Math.pow(2, currentZoom);
  console.log('🔍 GeoJump DEBUG: World size at zoom', currentZoom, ':', worldSize);
  
  // Simple conversion: degrees to pixels
  // 360 degrees longitude = worldSize pixels
  // 180 degrees latitude ≈ worldSize pixels (simplified)
  const pixelsPerDegreeLon = worldSize / 360;
  const pixelsPerDegreeLat = worldSize / 180; // Simplified, ignoring Mercator distortion for now
  
  console.log('🔍 GeoJump DEBUG: Pixels per degree:', { lon: pixelsPerDegreeLon, lat: pixelsPerDegreeLat });
  
  // For this test, let's assume the map started centered on approximately [0, 0] or some known point
  // We'll calculate movement relative to a reasonable starting point
  
  // Let's assume the map initially shows a world view centered around [0, 0]
  // Movement needed: target coordinates * pixels per degree
  const moveX = lon * pixelsPerDegreeLon;
  const moveY = -lat * pixelsPerDegreeLat; // Negative because Y is inverted in screen coordinates
  
  console.log('🔍 GeoJump DEBUG: Calculated movement:', { moveX, moveY });
  
  // Apply a scaling factor to make the movement more reasonable
  const scaleFactor = 0.1; // Start with 10% of calculated movement
  const adjustedMoveX = moveX * scaleFactor;
  const adjustedMoveY = moveY * scaleFactor;
  
  console.log('🔍 GeoJump DEBUG: Adjusted movement:', { adjustedMoveX, adjustedMoveY });
  
  // Apply the new transform
  const newTransform = `translate3d(${adjustedMoveX}px, ${adjustedMoveY}px, 0px)`;
  console.log('🔍 GeoJump DEBUG: Applying new transform:', newTransform);
  
  mapPane.style.transform = newTransform;
  
  // Trigger map update events
  setTimeout(() => {
    triggerMapUpdate(mapContainer);
  }, 100);
  
  console.log('🔍 GeoJump DEBUG: Direct map manipulation completed');
  return true;
};

// Complete solution: Move tiles AND trigger proper tile loading
(window as any).completeMapMove = function(deltaX: number = 100, deltaY: number = 50) {
  console.log('🔍 GeoJump DEBUG: Complete map move by delta:', { deltaX, deltaY });
  
  const mapPane = document.querySelector('.leaflet-pane.leaflet-map-pane') as HTMLElement;
  const tileContainer = document.querySelector('.leaflet-tile-container') as HTMLElement;
  const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
  
  if (!mapPane || !tileContainer || !mapContainer) {
    console.log('🔍 GeoJump DEBUG: Missing required elements');
    return false;
  }
  
  // Step 1: Move the tile container (as we did before)
  const currentTileTransform = tileContainer.style.transform;
  const tileTransformMatch = currentTileTransform.match(/translate3d\(([^,]+),\s*([^,]+),\s*([^)]+)\)\s*scale\(([^)]+)\)/);
  
  let currentTileX = 0, currentTileY = 0, currentTileZ = 0, currentScale = 1;
  
  if (tileTransformMatch) {
    currentTileX = parseFloat(tileTransformMatch[1]);
    currentTileY = parseFloat(tileTransformMatch[2]);
    currentTileZ = parseFloat(tileTransformMatch[3]);
    currentScale = parseFloat(tileTransformMatch[4]);
  }
  
  const newTileX = currentTileX - deltaX;
  const newTileY = currentTileY - deltaY;
  const newTileTransform = `translate3d(${newTileX}px, ${newTileY}px, ${currentTileZ}px) scale(${currentScale})`;
  
  tileContainer.style.transform = newTileTransform;
  mapPane.style.transform = 'translate3d(0px, 0px, 0px)';
  
  console.log('🔍 GeoJump DEBUG: Applied tile container transform:', newTileTransform);
  
  // Step 2: Calculate what new tiles we need
  const containerRect = mapContainer.getBoundingClientRect();
  const centerX = containerRect.width / 2;
  const centerY = containerRect.height / 2;
  
  // Get current zoom level
  let currentZoom = 2;
  const tileImages = mapContainer.querySelectorAll('.leaflet-tile');
  if (tileImages.length > 0) {
    const firstTile = tileImages[0] as HTMLImageElement;
    const tileUrlMatch = firstTile.src.match(/\/(\d+)\/\d+\/\d+\.png/);
    if (tileUrlMatch) {
      currentZoom = parseInt(tileUrlMatch[1]);
    }
  }
  
  console.log('🔍 GeoJump DEBUG: Current zoom level:', currentZoom);
  
  // Step 3: Calculate which tiles should be visible
  const tileSize = 256;
  const tilesPerRow = Math.pow(2, currentZoom);
  
  // Calculate the bounds of what should be visible
  const leftPixel = -newTileX - centerX;
  const topPixel = -newTileY - centerY;
  const rightPixel = leftPixel + containerRect.width;
  const bottomPixel = topPixel + containerRect.height;
  
  console.log('🔍 GeoJump DEBUG: Visible pixel bounds:', { leftPixel, topPixel, rightPixel, bottomPixel });
  
  // Convert to tile coordinates
  const leftTile = Math.floor(leftPixel / tileSize);
  const topTile = Math.floor(topPixel / tileSize);
  const rightTile = Math.ceil(rightPixel / tileSize);
  const bottomTile = Math.ceil(bottomPixel / tileSize);
  
  console.log('🔍 GeoJump DEBUG: Required tile bounds:', { leftTile, topTile, rightTile, bottomTile });
  
  // Step 4: Load missing tiles
  for (let x = leftTile; x <= rightTile; x++) {
    for (let y = topTile; y <= bottomTile; y++) {
      // Ensure tile coordinates are within valid bounds
      if (x >= 0 && x < tilesPerRow && y >= 0 && y < tilesPerRow) {
        loadTileIfMissing(x, y, currentZoom, tileContainer);
      }
    }
  }
  
  console.log('🔍 GeoJump DEBUG: Complete map move finished');
  return true;
};

function loadTileIfMissing(tileX: number, tileY: number, zoom: number, tileContainer: HTMLElement) {
  const tileUrl = `https://tiles.maps.opensearch.org/tiles/${zoom}/${tileX}/${tileY}.png?opensearch_tos_agree=true`;
  
  // Check if this tile already exists
  const existingTile = tileContainer.querySelector(`img[src="${tileUrl}"]`);
  if (existingTile) {
    console.log(`🔍 GeoJump DEBUG: Tile ${tileX},${tileY} already exists`);
    return;
  }
  
  console.log(`🔍 GeoJump DEBUG: Loading new tile ${tileX},${tileY} at zoom ${zoom}`);
  
  // Get the positioning reference from existing tiles
  const existingTiles = tileContainer.querySelectorAll('.leaflet-tile');
  let referenceOffsetX = 0;
  let referenceOffsetY = 0;
  
  if (existingTiles.length > 0) {
    // Analyze existing tile positions to understand the offset pattern
    const firstTile = existingTiles[0] as HTMLElement;
    const firstTileTransform = firstTile.style.transform;
    const transformMatch = firstTileTransform.match(/translate3d\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    
    if (transformMatch) {
      const firstTileX = parseFloat(transformMatch[1]);
      const firstTileY = parseFloat(transformMatch[2]);
      
      // Try to extract tile coordinates from the first tile's URL
      const firstTileUrlMatch = firstTile.src.match(/\/(\d+)\/(\d+)\/(\d+)\.png/);
      if (firstTileUrlMatch) {
        const firstTileCoordX = parseInt(firstTileUrlMatch[2]);
        const firstTileCoordY = parseInt(firstTileUrlMatch[3]);
        
        // Calculate the offset pattern
        referenceOffsetX = firstTileX - (firstTileCoordX * 256);
        referenceOffsetY = firstTileY - (firstTileCoordY * 256);
        
        console.log(`🔍 GeoJump DEBUG: Reference tile ${firstTileCoordX},${firstTileCoordY} at ${firstTileX},${firstTileY}`);
        console.log(`🔍 GeoJump DEBUG: Calculated offset pattern: ${referenceOffsetX}, ${referenceOffsetY}`);
      }
    }
  }
  
  // Create new tile image
  const tileImg = document.createElement('img');
  tileImg.alt = '';
  tileImg.role = 'presentation';
  tileImg.src = tileUrl;
  tileImg.className = 'leaflet-tile leaflet-tile-loaded filters-off';
  tileImg.style.width = '256px';
  tileImg.style.height = '256px';
  tileImg.style.opacity = '1';
  
  // Calculate tile position using the same offset pattern as existing tiles
  const tilePixelX = (tileX * 256) + referenceOffsetX;
  const tilePixelY = (tileY * 256) + referenceOffsetY;
  tileImg.style.transform = `translate3d(${tilePixelX}px, ${tilePixelY}px, 0px)`;
  
  console.log(`🔍 GeoJump DEBUG: Positioning new tile at translate3d(${tilePixelX}px, ${tilePixelY}px, 0px)`);
  
  // Add tile to container
  tileContainer.appendChild(tileImg);
  
  // Handle tile load events
  tileImg.onload = () => {
    console.log(`🔍 GeoJump DEBUG: Tile ${tileX},${tileY} loaded successfully`);
  };
  
  tileImg.onerror = () => {
    console.log(`🔍 GeoJump DEBUG: Tile ${tileX},${tileY} failed to load`);
    tileImg.remove();
  };
}
(window as any).betterMapMove = function(deltaX: number = 100, deltaY: number = 50) {
  console.log('🔍 GeoJump DEBUG: Better map move by delta:', { deltaX, deltaY });
  
  const mapPane = document.querySelector('.leaflet-pane.leaflet-map-pane') as HTMLElement;
  const tileContainer = document.querySelector('.leaflet-tile-container') as HTMLElement;
  
  if (!mapPane || !tileContainer) {
    console.log('🔍 GeoJump DEBUG: Missing map pane or tile container');
    return false;
  }
  
  console.log('🔍 GeoJump DEBUG: Current map pane transform:', mapPane.style.transform);
  console.log('🔍 GeoJump DEBUG: Current tile container transform:', tileContainer.style.transform);
  
  // Instead of moving the map pane, move the tile container
  // This keeps the tiles in the right relative position
  
  // Get current tile container transform
  const currentTileTransform = tileContainer.style.transform;
  const tileTransformMatch = currentTileTransform.match(/translate3d\(([^,]+),\s*([^,]+),\s*([^)]+)\)\s*scale\(([^)]+)\)/);
  
  let currentTileX = 0, currentTileY = 0, currentTileZ = 0, currentScale = 1;
  
  if (tileTransformMatch) {
    currentTileX = parseFloat(tileTransformMatch[1]);
    currentTileY = parseFloat(tileTransformMatch[2]);
    currentTileZ = parseFloat(tileTransformMatch[3]);
    currentScale = parseFloat(tileTransformMatch[4]);
  }
  
  console.log('🔍 GeoJump DEBUG: Current tile container values:', { 
    x: currentTileX, y: currentTileY, z: currentTileZ, scale: currentScale 
  });
  
  // Apply the movement to the tile container instead of the map pane
  const newTileX = currentTileX - deltaX; // Negative because tile movement is opposite to map movement
  const newTileY = currentTileY - deltaY;
  
  const newTileTransform = `translate3d(${newTileX}px, ${newTileY}px, ${currentTileZ}px) scale(${currentScale})`;
  console.log('🔍 GeoJump DEBUG: Applying new tile container transform:', newTileTransform);
  
  tileContainer.style.transform = newTileTransform;
  
  // Reset map pane to origin if it's been moved
  mapPane.style.transform = 'translate3d(0px, 0px, 0px)';
  
  console.log('🔍 GeoJump DEBUG: Better map move completed');
  return true;
};

// Even simpler: just adjust individual tile positions
(window as any).adjustTilePositions = function(deltaX: number = 100, deltaY: number = 50) {
  console.log('🔍 GeoJump DEBUG: Adjusting individual tile positions by:', { deltaX, deltaY });
  
  const tiles = document.querySelectorAll('.leaflet-tile');
  console.log('🔍 GeoJump DEBUG: Found', tiles.length, 'tiles to adjust');
  
  tiles.forEach((tile, index) => {
    const tileElement = tile as HTMLElement;
    const currentTransform = tileElement.style.transform;
    console.log(`🔍 GeoJump DEBUG: Tile ${index} current transform:`, currentTransform);
    
    const transformMatch = currentTransform.match(/translate3d\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    
    if (transformMatch) {
      const currentX = parseFloat(transformMatch[1]);
      const currentY = parseFloat(transformMatch[2]);
      const currentZ = parseFloat(transformMatch[3]);
      
      const newX = currentX - deltaX; // Negative because tile movement is opposite
      const newY = currentY - deltaY;
      
      const newTransform = `translate3d(${newX}px, ${newY}px, ${currentZ}px)`;
      tileElement.style.transform = newTransform;
      
      console.log(`🔍 GeoJump DEBUG: Tile ${index} new transform:`, newTransform);
    }
  });
  
  // Reset map pane to origin
  const mapPane = document.querySelector('.leaflet-pane.leaflet-map-pane') as HTMLElement;
  if (mapPane) {
    mapPane.style.transform = 'translate3d(0px, 0px, 0px)';
  }
  
  console.log('🔍 GeoJump DEBUG: Tile position adjustment completed');
  return true;
};
(window as any).forceTileReload = function() {
  console.log('🔍 GeoJump DEBUG: Forcing tile reload');
  
  const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
  if (!mapContainer) {
    console.log('🔍 GeoJump DEBUG: No map container found');
    return false;
  }
  
  // Method 1: Remove all tiles and trigger reload
  const tileContainer = document.querySelector('.leaflet-tile-container') as HTMLElement;
  if (tileContainer) {
    console.log('🔍 GeoJump DEBUG: Removing all tiles');
    const tiles = tileContainer.querySelectorAll('.leaflet-tile');
    tiles.forEach(tile => tile.remove());
    
    // Reset tile container
    const originalTransform = tileContainer.style.transform;
    tileContainer.style.transform = '';
    setTimeout(() => {
      tileContainer.style.transform = originalTransform;
    }, 100);
  }
  
  // Method 2: Try to find and reload the base layer
  const tileLayer = document.querySelector('.leaflet-layer');
  if (tileLayer) {
    console.log('🔍 GeoJump DEBUG: Found tile layer, forcing refresh');
    
    // Try to trigger a layer refresh by changing opacity
    const originalOpacity = (tileLayer as HTMLElement).style.opacity;
    (tileLayer as HTMLElement).style.opacity = '0';
    setTimeout(() => {
      (tileLayer as HTMLElement).style.opacity = originalOpacity || '1';
    }, 50);
  }
  
  // Method 3: Dispatch a comprehensive set of events
  const allEvents = [
    'movestart', 'move', 'moveend',
    'zoomstart', 'zoom', 'zoomend', 
    'viewreset', 'resize', 'load',
    'baselayerchange', 'layeradd',
    'tileloadstart', 'tileload', 'tileerror'
  ];
  
  allEvents.forEach(eventName => {
    const event = new Event(eventName, { bubbles: true });
    mapContainer.dispatchEvent(event);
  });
  
  // Method 4: Force complete DOM refresh
  setTimeout(() => {
    const parent = mapContainer.parentElement;
    const nextSibling = mapContainer.nextSibling;
    
    // Temporarily remove and re-add the map container
    if (parent) {
      parent.removeChild(mapContainer);
      setTimeout(() => {
        if (nextSibling) {
          parent.insertBefore(mapContainer, nextSibling);
        } else {
          parent.appendChild(mapContainer);
        }
        
        // Trigger final events after re-insertion
        setTimeout(() => {
          ['load', 'viewreset', 'moveend'].forEach(eventName => {
            const event = new Event(eventName, { bubbles: true });
            mapContainer.dispatchEvent(event);
          });
        }, 100);
        
      }, 100);
    }
  }, 500);
  
  return true;
};
(window as any).testMapMove = function(deltaX: number = 100, deltaY: number = 100) {
  console.log('🔍 GeoJump DEBUG: Test map move by delta:', { deltaX, deltaY });
  
  const mapPane = document.querySelector('.leaflet-pane.leaflet-map-pane') as HTMLElement;
  if (!mapPane) {
    console.log('🔍 GeoJump DEBUG: No map pane found');
    return false;
  }
  
  // Get current transform
  const currentTransform = mapPane.style.transform;
  console.log('🔍 GeoJump DEBUG: Current transform:', currentTransform);
  
  let currentX = 0, currentY = 0, currentZ = 0;
  
  const transformMatch = currentTransform.match(/translate3d\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
  if (transformMatch) {
    currentX = parseFloat(transformMatch[1]);
    currentY = parseFloat(transformMatch[2]);
    currentZ = parseFloat(transformMatch[3]);
  }
  
  // Apply delta movement
  const newX = currentX + deltaX;
  const newY = currentY + deltaY;
  
  const newTransform = `translate3d(${newX}px, ${newY}px, ${currentZ}px)`;
  console.log('🔍 GeoJump DEBUG: Applying test transform:', newTransform);
  
  mapPane.style.transform = newTransform;
  
  // Trigger update
  const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
  if (mapContainer) {
    setTimeout(() => {
      triggerMapUpdate(mapContainer);
    }, 100);
  }
  
  return true;
};

function triggerMapUpdate(mapContainer: HTMLElement) {
  console.log('🔍 GeoJump DEBUG: Triggering map update events');
  
  // First, try to force tile reload by manipulating the tile layer
  const tileContainer = document.querySelector('.leaflet-tile-container') as HTMLElement;
  if (tileContainer) {
    console.log('🔍 GeoJump DEBUG: Found tile container, forcing tile reload');
    
    // Get all current tiles
    const tiles = tileContainer.querySelectorAll('.leaflet-tile');
    console.log('🔍 GeoJump DEBUG: Found', tiles.length, 'tiles to refresh');
    
    // Remove all current tiles to force reload
    tiles.forEach((tile, index) => {
      console.log(`🔍 GeoJump DEBUG: Removing tile ${index}:`, tile);
      tile.remove();
    });
    
    // Reset tile container transform to trigger reload
    const originalTransform = tileContainer.style.transform;
    console.log('🔍 GeoJump DEBUG: Original tile container transform:', originalTransform);
    
    // Temporarily change and restore transform to trigger tile loading
    tileContainer.style.transform = 'translate3d(1px, 1px, 0px) scale(1)';
    setTimeout(() => {
      tileContainer.style.transform = originalTransform;
    }, 50);
  }
  
  // Trigger various events that might cause the map to update tiles
  const events = [
    'movestart',
    'move', 
    'moveend',
    'viewreset',
    'zoomend',
    'resize',
    'load'
  ];
  
  events.forEach(eventName => {
    const event = new Event(eventName, { bubbles: true });
    mapContainer.dispatchEvent(event);
    console.log(`🔍 GeoJump DEBUG: Dispatched ${eventName} event`);
  });
  
  // Try to trigger Leaflet-specific events
  const leafletEvents = [
    'baselayerchange',
    'layeradd',
    'layerremove',
    'tileload',
    'tileloadstart'
  ];
  
  leafletEvents.forEach(eventName => {
    const event = new CustomEvent(eventName, { 
      bubbles: true,
      detail: { target: mapContainer }
    });
    mapContainer.dispatchEvent(event);
    console.log(`🔍 GeoJump DEBUG: Dispatched custom ${eventName} event`);
  });
  
  // Force a complete repaint and resize
  setTimeout(() => {
    console.log('🔍 GeoJump DEBUG: Forcing window resize and repaint');
    
    // Trigger window resize
    const resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
    
    // Force a repaint by temporarily hiding and showing the container
    const originalDisplay = mapContainer.style.display;
    const originalVisibility = mapContainer.style.visibility;
    
    mapContainer.style.display = 'none';
    mapContainer.offsetHeight; // Trigger reflow
    mapContainer.style.display = originalDisplay;
    
    // Also try visibility toggle
    setTimeout(() => {
      mapContainer.style.visibility = 'hidden';
      mapContainer.offsetHeight; // Trigger reflow
      mapContainer.style.visibility = originalVisibility;
      
      // Final attempt: trigger more events after repaint
      setTimeout(() => {
        ['moveend', 'zoomend', 'viewreset'].forEach(eventName => {
          const event = new Event(eventName, { bubbles: true });
          mapContainer.dispatchEvent(event);
        });
        
        console.log('🔍 GeoJump DEBUG: Final tile refresh attempt completed');
      }, 100);
      
    }, 100);
    
  }, 200);
  
  // Try to access and manipulate the Leaflet map instance if possible
  setTimeout(() => {
    console.log('🔍 GeoJump DEBUG: Attempting to access Leaflet map instance for tile refresh');
    
    // Look for the Leaflet map instance in various places
    const leafletContainer = mapContainer;
    const possibleMapProps = ['_leaflet_map', '_map', 'map', '__leafletMap'];
    
    for (const prop of possibleMapProps) {
      if ((leafletContainer as any)[prop]) {
        const leafletMap = (leafletContainer as any)[prop];
        console.log(`🔍 GeoJump DEBUG: Found Leaflet map at ${prop}:`, leafletMap);
        
        // Try to call Leaflet methods to refresh tiles
        if (typeof leafletMap.invalidateSize === 'function') {
          console.log('🔍 GeoJump DEBUG: Calling invalidateSize()');
          leafletMap.invalidateSize();
        }
        
        if (typeof leafletMap._resetView === 'function') {
          console.log('🔍 GeoJump DEBUG: Calling _resetView()');
          try {
            leafletMap._resetView();
          } catch (error) {
            console.log('🔍 GeoJump DEBUG: _resetView failed:', error);
          }
        }
        
        if (typeof leafletMap._update === 'function') {
          console.log('🔍 GeoJump DEBUG: Calling _update()');
          try {
            leafletMap._update();
          } catch (error) {
            console.log('🔍 GeoJump DEBUG: _update failed:', error);
          }
        }
        
        // Try to access tile layers
        if (leafletMap._layers) {
          console.log('🔍 GeoJump DEBUG: Found map layers:', leafletMap._layers);
          Object.values(leafletMap._layers).forEach((layer: any) => {
            if (layer.redraw && typeof layer.redraw === 'function') {
              console.log('🔍 GeoJump DEBUG: Calling layer.redraw()');
              layer.redraw();
            }
            if (layer._update && typeof layer._update === 'function') {
              console.log('🔍 GeoJump DEBUG: Calling layer._update()');
              try {
                layer._update();
              } catch (error) {
                console.log('🔍 GeoJump DEBUG: layer._update failed:', error);
              }
            }
          });
        }
        
        break;
      }
    }
  }, 300);
}

/**
 * Alternative approach: Try to manipulate the map by simulating drag events
 */
(window as any).simulateMapDrag = function(lat: number = 40.7128, lon: number = -74.0060, zoom: number = 12) {
  console.log('🔍 GeoJump DEBUG: Simulating map drag to coordinates:', lat, lon, zoom);
  
  const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
  if (!mapContainer) {
    console.log('🔍 GeoJump DEBUG: No map container found');
    return false;
  }
  
  // Get container center
  const rect = mapContainer.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  console.log('🔍 GeoJump DEBUG: Container center:', { centerX, centerY });
  
  // Calculate a drag offset (this is a rough approximation)
  // In a real implementation, you'd need proper coordinate conversion
  const dragOffsetX = (lon - (-74)) * 10; // Rough approximation
  const dragOffsetY = (lat - 40.7) * -10; // Rough approximation (negative because Y is inverted)
  
  console.log('🔍 GeoJump DEBUG: Calculated drag offset:', { dragOffsetX, dragOffsetY });
  
  // Simulate mouse events for dragging
  const mouseDownEvent = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    clientX: centerX,
    clientY: centerY,
    button: 0
  });
  
  const mouseMoveEvent = new MouseEvent('mousemove', {
    bubbles: true,
    cancelable: true,
    clientX: centerX + dragOffsetX,
    clientY: centerY + dragOffsetY,
    button: 0
  });
  
  const mouseUpEvent = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    clientX: centerX + dragOffsetX,
    clientY: centerY + dragOffsetY,
    button: 0
  });
  
  // Dispatch the events in sequence
  mapContainer.dispatchEvent(mouseDownEvent);
  
  setTimeout(() => {
    mapContainer.dispatchEvent(mouseMoveEvent);
    
    setTimeout(() => {
      mapContainer.dispatchEvent(mouseUpEvent);
      console.log('🔍 GeoJump DEBUG: Drag simulation completed');
    }, 50);
  }, 50);
  
  return true;
};

/**
 * Export the main function for use in the service
 */
export function jumpToCoordinatesViaDOMManipulation(
  coordinates: GeojumpCoordinates, 
  options: GeojumpOptions = {}
): boolean {
  console.log('🔍 GeoJump DEBUG: Jumping via DOM manipulation');
  
  // Try the direct transform approach first
  const success = (window as any).directMapJump(
    coordinates.lat, 
    coordinates.lon, 
    coordinates.zoom || options.zoomLevel || 10
  );
  
  if (!success) {
    console.log('🔍 GeoJump DEBUG: Direct transform failed, trying drag simulation');
    return (window as any).simulateMapDrag(
      coordinates.lat, 
      coordinates.lon, 
      coordinates.zoom || options.zoomLevel || 10
    );
  }
  
  return success;
}
