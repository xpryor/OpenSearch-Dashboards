# GeoJump Plugin Setup and Testing Guide

This guide will help you set up and test the GeoJump plugin for OpenSearch Dashboards.

## Overview

The GeoJump plugin provides the capability to quickly navigate to specific geographic locations on maps by entering coordinates in various formats. This addresses the customer requirement for "geojumping" functionality within OpenSearch Dashboards maps.

## Features Implemented

✅ **Multiple Coordinate Formats**
- Decimal Degrees: `40.7128, -74.0060`
- Degrees, Minutes, Seconds: `40°42'46"N 74°0'21"W`
- Degrees, Decimal Minutes: `40°42.767'N 74°0.35'W`

✅ **Map Integration**
- Automatic detection of existing map visualizations
- Support for Mapbox GL JS, Leaflet, and OpenSearch native maps
- Custom event system for unsupported map types

✅ **User Interface**
- Dedicated GeoJump application with tabbed interface
- Compact embeddable component for dashboards
- Recent jumps history
- Comprehensive help documentation

✅ **Advanced Features**
- Configurable zoom levels (1-18)
- Optional visual markers at jump locations
- Smooth animated transitions
- Input validation and error handling

## Installation

The plugin is already integrated into your OpenSearch Dashboards installation at:
```
/Users/pryorx/dev/OpenSearch-Dashboards/src/plugins/geojump/
```

## File Structure

```
src/plugins/geojump/
├── README.md                           # Plugin documentation
├── opensearch_dashboards.json         # Plugin configuration
├── common/
│   └── index.ts                       # Shared constants and types
├── public/
│   ├── application.tsx                # Application entry point
│   ├── plugin.ts                      # Main plugin class
│   ├── index.ts                       # Plugin exports
│   ├── types.ts                       # TypeScript interfaces
│   ├── index.scss                     # Plugin styles
│   ├── components/
│   │   ├── app.tsx                    # Main application component
│   │   ├── geojump_panel.tsx          # Coordinate input panel
│   │   ├── map_integration.tsx        # Map integration logic
│   │   └── geojump_embeddable.tsx     # Embeddable component
│   ├── services/
│   │   └── geojump_service.ts         # Core geojump functionality
│   └── utils/
│       ├── coordinate_parser.ts       # Coordinate parsing logic
│       └── coordinate_parser.test.ts  # Unit tests
└── demo.js                           # Demo script
```

## Testing the Plugin

### 1. Build and Start OpenSearch Dashboards

```bash
cd /Users/pryorx/dev/OpenSearch-Dashboards

# Bootstrap dependencies
yarn osd bootstrap --single-version=loose

# Start in development mode
yarn start --no-base-path
```

### 2. Access the GeoJump Plugin

1. Open your browser to `http://localhost:5601`
2. Look for "GeoJump" in the main navigation menu
3. Click to open the GeoJump interface

### 3. Test Coordinate Formats

Try these example coordinates:

**Decimal Degrees:**
- `40.7128, -74.0060` (New York City)
- `51.5074, -0.1278` (London)
- `35.6762, 139.6503` (Tokyo)

**Degrees, Minutes, Seconds:**
- `40°42'46"N 74°0'21"W` (New York City)
- `51°30'26"N 0°7'40"W` (London)

**Degrees, Decimal Minutes:**
- `40°42.767'N 74°0.35'W` (New York City)
- `51°30.444'N 0°7.667'W` (London)

### 4. Test Map Integration

To test map integration:

1. Create a dashboard with a map visualization (Tile Map or Region Map)
2. Open the GeoJump plugin in another tab
3. Enter coordinates and click "Jump to Location"
4. The map should automatically center on the specified coordinates

## Integration with Existing Maps

The plugin automatically integrates with:

- **Tile Map visualizations** - Standard OpenSearch Dashboards tile maps
- **Region Map visualizations** - Choropleth maps
- **Custom map embeddables** - Third-party map components
- **Mapbox GL JS maps** - Direct integration with Mapbox API
- **Leaflet maps** - Integration with Leaflet mapping library

### Custom Map Integration

If you have custom maps that don't integrate automatically, you can listen for geojump events:

```javascript
// Listen for geojump events
document.addEventListener('geojump', (event) => {
  const { coordinates, options } = event.detail;
  
  // Implement your custom map navigation
  yourMap.setCenter([coordinates.lat, coordinates.lon]);
  yourMap.setZoom(coordinates.zoom || 10);
  
  // Optional: Add marker
  if (options.showMarker) {
    yourMap.addMarker([coordinates.lat, coordinates.lon]);
  }
});
```

## API Usage

Other plugins can integrate with GeoJump programmatically:

```typescript
// Get the GeoJump plugin instance
const geojumpPlugin = plugins.geojump;

// Jump to coordinates
geojumpPlugin.jumpToCoordinates(
  { lat: 40.7128, lon: -74.0060, zoom: 12 },
  { 
    showMarker: true, 
    animateTransition: true,
    markerDuration: 5000 
  }
);

// Parse coordinate strings
const coordinates = geojumpPlugin.parseCoordinates("40.7128, -74.0060");

// Format coordinates
const formatted = geojumpPlugin.formatCoordinates(
  { lat: 40.7128, lon: -74.0060 },
  "degrees_minutes_seconds"
);
```

## Testing in Your Cloud Environment

To test the plugin in your local cloud environment:

### 1. Build for Production

```bash
# Build the complete OpenSearch Dashboards package
yarn build --skip-os-packages

# The built plugin will be included in the build/opensearch-dashboards-* directory
```

### 2. Deploy to Your Environment

1. Copy the built OpenSearch Dashboards to your cloud environment
2. Start OpenSearch Dashboards
3. The GeoJump plugin will be automatically available

### 3. Verify Integration

1. Create dashboards with map visualizations
2. Test coordinate jumping from the GeoJump interface
3. Verify that maps respond to coordinate jumps
4. Test different coordinate formats

## Troubleshooting

### Plugin Not Appearing

1. Check that the plugin is enabled in `opensearch_dashboards.yml`:
   ```yaml
   # No specific configuration needed - plugin is enabled by default
   ```

2. Verify plugin files are present in `src/plugins/geojump/`

3. Check browser console for JavaScript errors

### Maps Not Responding to Jumps

1. **Check Console**: Look for integration errors in browser console
2. **Verify Map Type**: Ensure your map is supported (Mapbox, Leaflet, etc.)
3. **Custom Integration**: Implement custom event listeners if needed

### Coordinate Parsing Issues

1. **Format Check**: Verify coordinate format matches supported patterns
2. **Range Validation**: Ensure coordinates are within valid ranges
3. **Separator**: Use comma or space to separate lat/lon values

## Performance Considerations

- **Disable Animations**: Turn off smooth transitions for faster jumps
- **Reduce Marker Duration**: Shorter marker display times
- **Zoom Level**: Lower zoom levels load faster

## Next Steps

1. **Test with Real Data**: Use coordinates from your actual use cases
2. **Custom Styling**: Modify CSS in `index.scss` for your branding
3. **Additional Features**: Extend functionality based on user feedback
4. **Integration**: Connect with your existing mapping workflows

## Support

For issues and questions:
- Check the browser console for error messages
- Review the plugin logs in OpenSearch Dashboards
- Test coordinate parsing with the demo script: `node src/plugins/geojump/demo.js`

The GeoJump plugin is now ready for testing and deployment in your environment!
