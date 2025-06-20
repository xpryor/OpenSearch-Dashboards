# GeoJump Plugin - Refactored Implementation

This is a completely refactored version of the GeoJump plugin that properly integrates with OpenSearch Dashboards maps using the native `BaseMapsVisualization` and `OpenSearchDashboardsMap` APIs.

## Key Changes

### 1. Proper Map Integration (`geojump_map_service.ts`)
- **Intercepts OpenSearchDashboardsMap constructor**: Captures map instances as they're created
- **Uses lazyLoadMapsLegacyModules**: Properly loads the maps_legacy modules
- **Captures `_opensearchDashboardsMap` property**: The key property used by all map visualizations
- **Scans React component trees**: Finds map instances in visualization components

### 2. Visualization Extension (`geojump_visualization_extension.ts`)
- **Extends BaseMapsVisualization**: Hooks into the base class used by all map visualizations
- **Extends TileMapVisualization**: Specific integration with tile maps
- **Extends RegionMapVisualization**: Specific integration with region maps
- **Adds jumpToCoordinates method**: Directly to visualization instances

### 3. Refactored Service (`geojump_service_refactored.ts`)
- **Uses proper integration**: Leverages the map service and visualization extension
- **Fallback methods**: Multiple approaches if primary methods fail
- **Better error handling**: Proper success/failure events
- **Debug information**: Comprehensive debugging capabilities

### 4. Updated Plugin (`plugin_refactored.ts`)
- **Simplified approach**: Uses the new service architecture
- **Better control placement**: Improved map control integration
- **Debug functions**: Global debug functions for development

## How It Works

### Map Capture Process
1. **Interceptor Setup**: When the plugin starts, it sets up interceptors for the OpenSearchDashboardsMap constructor
2. **Map Creation**: When a map visualization is created, our interceptor captures the instance
3. **React Tree Scanning**: Periodically scans React component trees to find existing maps
4. **Storage**: Captured maps are stored with metadata (type, container, timestamp)

### Jump Process
1. **Primary Method**: Uses captured OpenSearchDashboardsMap instances with `setCenter()` and `setZoomLevel()`
2. **Leaflet Fallback**: If OpenSearch methods fail, tries underlying Leaflet map with `setView()`
3. **Direct Access**: Attempts direct Leaflet container access
4. **Custom Events**: Dispatches custom events as last resort

### Integration Points
- **BaseMapsVisualization._makeOpenSearchDashboardsMap()**: Captures map instances during creation
- **BaseMapsVisualization.render()**: Ensures maps are captured after rendering
- **React Component State**: Accesses `_opensearchDashboardsMap` property in component state

## Usage

### Basic Usage
```typescript
// Jump to coordinates
const success = await geojumpService.jumpToCoordinates({
  lat: 40.7128,
  lon: -74.0060,
  zoom: 12
});
```

### Debug Information
```typescript
// Get debug info
const debugInfo = geojumpService.getDebugInfo();
console.log('Captured maps:', debugInfo.capturedMaps);
console.log('Map details:', debugInfo.mapDetails);
```

### Manual Map Registration
```typescript
// Register a map manually
geojumpService.registerMap(mapInstance, containerElement);
```

## Testing

### Test Panel
The plugin includes a comprehensive test panel accessible via the "Test Panel" tab:
- **Preset Locations**: Quick jump to major cities
- **Custom Coordinates**: Enter any lat/lon coordinates
- **Debug Information**: View captured maps and system state
- **Rescan Maps**: Force a rescan for new maps

### Debug Functions
Global debug functions are available in the browser console:
```javascript
// Get debug information
window.geojumpDebug.getDebugInfo()

// Rescan for maps
window.geojumpDebug.rescanMaps()

// Jump to coordinates
window.geojumpDebug.jumpTo(40.7128, -74.0060, 12)
```

## Architecture

### File Structure
```
src/plugins/geojump/public/
├── map_integration/
│   ├── geojump_map_service.ts          # Core map capture and manipulation
│   └── geojump_visualization_extension.ts  # Visualization class extensions
├── services/
│   └── geojump_service_refactored.ts   # Main service with proper integration
├── components/
│   └── geojump_test_panel.tsx          # Test and debug panel
├── plugin_refactored.ts                # Refactored plugin entry point
└── ...
```

### Key Classes
- **GeojumpMapService**: Handles map capture and coordinate jumping
- **GeojumpVisualizationExtension**: Extends visualization classes
- **GeojumpServiceRefactored**: Main service orchestrating everything

## Differences from Original

### Original Approach Issues
- ❌ DOM manipulation and React internals access
- ❌ Aggressive element searching
- ❌ No proper integration with OpenSearch Dashboards APIs
- ❌ Unreliable map detection

### Refactored Approach Benefits
- ✅ Native OpenSearch Dashboards API integration
- ✅ Proper constructor interception
- ✅ Reliable map instance capture
- ✅ Follows OpenSearch Dashboards patterns
- ✅ Better error handling and debugging
- ✅ Extensible architecture

## Development

### Building
```bash
yarn build
```

### Testing
1. Start OpenSearch Dashboards
2. Navigate to the GeoJump plugin
3. Go to the "Test Panel" tab
4. Try jumping to different coordinates
5. Check debug information

### Debugging
- Check browser console for detailed logs (prefixed with `🔍 GeoJump:`)
- Use the test panel's debug information section
- Use global debug functions in browser console

## Integration with Existing Maps

The refactored plugin automatically integrates with:
- **Tile Map visualizations** (coordinate maps)
- **Region Map visualizations** 
- **Custom map embeddables**
- **Any visualization using BaseMapsVisualization**

No additional configuration is required - the plugin detects and integrates with maps automatically.
