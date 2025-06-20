import React, { useState, useEffect } from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiButton,
  EuiFieldText,
  EuiFormRow,
  EuiCallOut,
  EuiCode,
  EuiCollapsibleNav,
  EuiCollapsibleNavGroup,
  EuiText,
  EuiButtonGroup,
} from '@elastic/eui';
import { GeojumpCoordinates } from '../../common';

interface GeojumpTestPanelProps {
  onJump?: (coordinates: GeojumpCoordinates) => Promise<boolean>;
  getDebugInfo?: () => any;
  rescanMaps?: () => Promise<void>;
}

export const GeojumpTestPanel: React.FC<GeojumpTestPanelProps> = ({
  onJump,
  getDebugInfo,
  rescanMaps,
}) => {
  const [lat, setLat] = useState('40.7128');
  const [lon, setLon] = useState('-74.0060');
  const [zoom, setZoom] = useState('12');
  const [isJumping, setIsJumping] = useState(false);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [selectedPreset, setSelectedPreset] = useState('nyc');

  const presets = [
    { id: 'nyc', label: 'New York City', lat: 40.7128, lon: -74.0060, zoom: 12 },
    { id: 'london', label: 'London', lat: 51.5074, lon: -0.1278, zoom: 12 },
    { id: 'tokyo', label: 'Tokyo', lat: 35.6762, lon: 139.6503, zoom: 12 },
    { id: 'sydney', label: 'Sydney', lat: -33.8688, lon: 151.2093, zoom: 12 },
    { id: 'paris', label: 'Paris', lat: 48.8566, lon: 2.3522, zoom: 12 },
  ];

  const presetOptions = presets.map(preset => ({
    id: preset.id,
    label: preset.label,
  }));

  useEffect(() => {
    if (getDebugInfo) {
      const info = getDebugInfo();
      setDebugInfo(info);
    }
  }, [getDebugInfo]);

  const handlePresetChange = (optionId: string) => {
    setSelectedPreset(optionId);
    const preset = presets.find(p => p.id === optionId);
    if (preset) {
      setLat(preset.lat.toString());
      setLon(preset.lon.toString());
      setZoom(preset.zoom.toString());
    }
  };

  const handleJump = async () => {
    if (!onJump) return;

    setIsJumping(true);
    setLastResult(null);

    try {
      const coordinates: GeojumpCoordinates = {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        zoom: parseInt(zoom, 10),
      };

      console.log('🔍 GeoJump Test: Jumping to coordinates:', coordinates);
      const result = await onJump(coordinates);
      setLastResult(result);
      console.log('🔍 GeoJump Test: Jump result:', result);
    } catch (error) {
      console.error('🔍 GeoJump Test: Jump error:', error);
      setLastResult(false);
    } finally {
      setIsJumping(false);
    }
  };

  const handleRescan = async () => {
    if (rescanMaps) {
      console.log('🔍 GeoJump Test: Rescanning maps');
      await rescanMaps();
      
      // Update debug info
      if (getDebugInfo) {
        const info = getDebugInfo();
        setDebugInfo(info);
      }
    }
  };

  const handleRefreshDebug = () => {
    if (getDebugInfo) {
      const info = getDebugInfo();
      setDebugInfo(info);
    }
  };

  return (
    <EuiPanel paddingSize="l">
      <EuiTitle size="m">
        <h2>GeoJump Test Panel</h2>
      </EuiTitle>
      
      <EuiSpacer size="m" />
      
      <EuiFormRow label="Location Presets">
        <EuiButtonGroup
          legend="Choose a preset location"
          options={presetOptions}
          idSelected={selectedPreset}
          onChange={handlePresetChange}
          buttonSize="s"
          isFullWidth
        />
      </EuiFormRow>

      <EuiSpacer size="m" />

      <EuiFormRow label="Latitude">
        <EuiFieldText
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="40.7128"
        />
      </EuiFormRow>

      <EuiFormRow label="Longitude">
        <EuiFieldText
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          placeholder="-74.0060"
        />
      </EuiFormRow>

      <EuiFormRow label="Zoom Level">
        <EuiFieldText
          value={zoom}
          onChange={(e) => setZoom(e.target.value)}
          placeholder="12"
        />
      </EuiFormRow>

      <EuiSpacer size="m" />

      <EuiButton
        fill
        onClick={handleJump}
        isLoading={isJumping}
        disabled={!onJump}
      >
        {isJumping ? 'Jumping...' : 'Jump to Coordinates'}
      </EuiButton>

      <EuiSpacer size="s" />

      <EuiButton
        onClick={handleRescan}
        disabled={!rescanMaps}
        size="s"
      >
        Rescan Maps
      </EuiButton>

      <EuiSpacer size="m" />

      {lastResult !== null && (
        <EuiCallOut
          title={lastResult ? 'Jump Successful!' : 'Jump Failed'}
          color={lastResult ? 'success' : 'danger'}
          iconType={lastResult ? 'check' : 'alert'}
        >
          <p>
            {lastResult
              ? `Successfully jumped to coordinates: ${lat}, ${lon} (zoom: ${zoom})`
              : 'Failed to jump to coordinates. Check the console for more details.'}
          </p>
        </EuiCallOut>
      )}

      <EuiSpacer size="m" />

      <EuiCollapsibleNav>
        <EuiCollapsibleNavGroup
          title="Debug Information"
          iconType="bug"
          isCollapsible={true}
          initialIsOpen={false}
        >
          <EuiButton
            onClick={handleRefreshDebug}
            size="s"
            style={{ marginBottom: '10px' }}
          >
            Refresh Debug Info
          </EuiButton>
          
          {debugInfo ? (
            <div>
              <EuiText size="s">
                <p><strong>Captured Maps:</strong> {debugInfo.capturedMaps}</p>
                <p><strong>Leaflet Containers:</strong> {debugInfo.leafletContainers}</p>
                <p><strong>Visualizations:</strong> {debugInfo.visualizations}</p>
                <p><strong>Initialized:</strong> {debugInfo.isInitialized ? 'Yes' : 'No'}</p>
              </EuiText>
              
              {debugInfo.mapDetails && debugInfo.mapDetails.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <EuiText size="s"><strong>Map Details:</strong></EuiText>
                  {debugInfo.mapDetails.map((map: any, index: number) => (
                    <EuiCode key={index} style={{ display: 'block', marginTop: '5px', fontSize: '11px' }}>
                      Map {index}: {map.type} | Created: {map.timestamp} | Methods: {map.methods.join(', ')}
                    </EuiCode>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EuiText size="s" color="subdued">
              No debug information available
            </EuiText>
          )}
        </EuiCollapsibleNavGroup>
      </EuiCollapsibleNav>
    </EuiPanel>
  );
};
