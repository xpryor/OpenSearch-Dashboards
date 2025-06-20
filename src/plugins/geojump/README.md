# GeoJump Plugin for OpenSearch Dashboards

The GeoJump plugin provides the capability to quickly navigate to specific geographic locations on maps by entering coordinates in various formats. This addresses the customer requirement for "geojumping" functionality within OpenSearch Dashboards maps.

## Features

✅ **Multiple Coordinate Formats**
- Decimal Degrees: `40.7128, -74.0060`
- Degrees, Minutes, Seconds: `40°42'46"N 74°0'21"W`
- Degrees, Decimal Minutes: `40°42.767'N 74°0.35'W`

✅ **Map Integration**
- Automatic detection of existing map visualizations
- Support for Mapbox GL JS, Leaflet, and OpenSearch native maps
- Custom event system for unsupported map types
- Embedded map controls for direct access from visualizations

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

## Usage

### Standalone Application

1. Navigate to the GeoJump application from the OpenSearch Dashboards main menu
2. Enter coordinates in your preferred format
3. Click "Jump to Location" to navigate to those coordinates on all available maps

### Embedded Map Controls

The GeoJump plugin automatically adds a map control button to all map visualizations in dashboards. To use:

1. Look for the 📍 (pin) icon in the top-right corner of any map visualization
2. Click the icon to open the GeoJump control panel
3. Enter coordinates and click "Jump" to navigate the map to that location

### Programmatic Usage

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

// Add a GeoJump control to a custom map
const control = geojumpPlugin.addMapControl(mapElement, {
  position: 'topRight', // 'topRight', 'topLeft', 'bottomRight', 'bottomLeft'
  onJump: (coordinates) => {
    console.log('Jumped to:', coordinates);
  }
});

// Create an embeddable GeoJump panel
const embeddable = geojumpPlugin.createEmbeddable(containerElement, {
  compact: true,
  onJump: (coordinates) => {
    console.log('Jumped to:', coordinates);
  }
});

// Clean up when done
control.destroy();
embeddable.destroy();
```

## Supported Coordinate Formats

### Decimal Degrees
```
40.7128, -74.0060
40.7128 -74.0060
```

### Degrees, Minutes, Seconds
```
40°42'46"N 74°0'21"W
40° 42' 46" N, 74° 0' 21" W
```

### Degrees, Decimal Minutes
```
40°42.767'N 74°0.35'W
40° 42.767' N, 74° 0.35' W
```

## Development

### File Structure

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
│   │   ├── geojump_embeddable.tsx     # Embeddable component
│   │   └── geojump_map_control.tsx    # Map control button
│   ├── services/
│   │   └── geojump_service.ts         # Core geojump functionality
│   └── utils/
│       ├── coordinate_parser.ts       # Coordinate parsing logic
│       └── coordinate_parser.test.ts  # Unit tests
└── demo.js                           # Demo script
```

### Building and Testing

```bash
# From the OpenSearch-Dashboards directory
yarn osd bootstrap --single-version=loose
yarn start --no-base-path
```

## License

This code is licensed under the Apache License 2.0.
