import React, { useState, useRef, useEffect } from 'react';
import {
  EuiButtonIcon,
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiFieldText,
  EuiFormRow,
  EuiButton,
  EuiRange,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { GeojumpCoordinates } from '../../common';
import { CoordinateParser } from '../utils/coordinate_parser';

interface GeojumpMapControlProps {
  mapContainer: HTMLElement;
  position?: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
  onJump?: (coordinates: GeojumpCoordinates, options?: any) => void;
}

/**
 * A map control button that opens a GeoJump panel when clicked
 */
export const GeojumpMapControl: React.FC<GeojumpMapControlProps> = ({
  mapContainer,
  position = 'topRight',
  onJump,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [coordinateInput, setCoordinateInput] = useState('');
  const [zoomLevel, setZoomLevel] = useState(12);
  const [isJumping, setIsJumping] = useState(false);
  const [isHoveringPanel, setIsHoveringPanel] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);
  const [controlPosition, setControlPosition] = useState<React.CSSProperties>({});

  // Disable only the map elements, not the entire container
  const disableMapInteractions = () => {
    if (mapContainer) {
      console.log('🔍 GeoJump: Disabling map interactions');
      
      // Disable pointer events on the Leaflet container specifically
      const leafletContainer = mapContainer.querySelector('.leaflet-container');
      if (leafletContainer) {
        (leafletContainer as HTMLElement).style.pointerEvents = 'none';
        (leafletContainer as HTMLElement).style.userSelect = 'none';
      }
      
      // Also disable other map-specific elements
      const mapElements = mapContainer.querySelectorAll('.vis-map, .tile-map, .region-map, .mapboxgl-map');
      mapElements.forEach(element => {
        (element as HTMLElement).style.pointerEvents = 'none';
        (element as HTMLElement).style.userSelect = 'none';
      });
      
      mapContainer.classList.add('geojump-map-disabled');
    }
  };

  const enableMapInteractions = () => {
    if (mapContainer) {
      console.log('🔍 GeoJump: Enabling map interactions');
      
      // Re-enable pointer events on the Leaflet container
      const leafletContainer = mapContainer.querySelector('.leaflet-container');
      if (leafletContainer) {
        (leafletContainer as HTMLElement).style.pointerEvents = 'auto';
        (leafletContainer as HTMLElement).style.userSelect = 'auto';
      }
      
      // Re-enable other map-specific elements
      const mapElements = mapContainer.querySelectorAll('.vis-map, .tile-map, .region-map, .mapboxgl-map');
      mapElements.forEach(element => {
        (element as HTMLElement).style.pointerEvents = 'auto';
        (element as HTMLElement).style.userSelect = 'auto';
      });
      
      mapContainer.classList.remove('geojump-map-disabled');
    }
  };

  // Handle panel interactions - disable map when popover is open
  const handlePanelMouseEnter = () => {
    setIsHoveringPanel(true);
  };

  const handlePanelMouseLeave = () => {
    setIsHoveringPanel(false);
  };

  // Prevent map events when hovering panel
  const preventMapEvents = (e: Event) => {
    const target = e.target as HTMLElement;
    
    // Only prevent if the event is coming from the map area, not our panel
    if (target && !target.closest('.geojump-map-control-overlay')) {
      const mapElement = target.closest('.leaflet-container, .mapboxgl-map');
      if (mapElement) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  };

  // Disable map interactions when popover is open
  useEffect(() => {
    if (isPopoverOpen) {
      console.log('🔍 GeoJump: Disabling map interactions - popover opened');
      disableMapInteractions();
    } else {
      console.log('🔍 GeoJump: Enabling map interactions - popover closed');
      enableMapInteractions();
    }
    
    // Cleanup function
    return () => {
      if (isPopoverOpen) {
        enableMapInteractions();
      }
    };
  }, [isPopoverOpen]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      enableMapInteractions();
      
      // Clean up document listeners
      document.removeEventListener('mousedown', preventMapEvents, { capture: true });
      document.removeEventListener('mouseup', preventMapEvents, { capture: true });
      document.removeEventListener('mousemove', preventMapEvents, { capture: true });
      document.removeEventListener('dblclick', preventMapEvents, { capture: true });
      document.removeEventListener('wheel', preventMapEvents, { capture: true });
    };
  }, []);

  // Calculate position based on the map container
  useEffect(() => {
    if (!mapContainer) return;

    const positionStyles: Record<string, React.CSSProperties> = {
      topRight: {
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 1000,
      },
      topLeft: {
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 1000,
      },
      bottomRight: {
        position: 'absolute',
        bottom: '32px',
        right: '12px',
        zIndex: 1000,
      },
      bottomLeft: {
        position: 'absolute',
        bottom: '32px',
        left: '12px',
        zIndex: 1000,
      },
    };

    setControlPosition(positionStyles[position]);
  }, [mapContainer, position]);

  const onButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsPopoverOpen(false);
  };

  const handleJump = async () => {
    if (!onJump || !coordinateInput.trim()) return;

    setIsJumping(true);
    
    try {
      // Parse coordinates
      const coordinates = CoordinateParser.parseCoordinates(coordinateInput.trim());
      
      if (!coordinates) {
        console.error('🔍 GeoJump: Invalid coordinates format');
        return;
      }

      // Add zoom level to coordinates
      const coordsWithZoom: GeojumpCoordinates = {
        ...coordinates,
        zoom: zoomLevel,
      };

      console.log('🔍 GeoJump: Parsed coordinates from input:', coordinateInput.trim());
      console.log('🔍 GeoJump: Jumping to coordinates from map control:', coordsWithZoom);
      console.log('🔍 GeoJump: Expected location: lat=' + coordsWithZoom.lat + ', lon=' + coordsWithZoom.lon);
      
      await onJump(coordsWithZoom, { 
        zoomLevel,
        showMarker: true,
        animateTransition: true 
      });
      
      // Keep the popover open after jumping for easy re-use
    } catch (error) {
      console.error('🔍 GeoJump: Error jumping to coordinates:', error);
    } finally {
      setIsJumping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJump();
    }
  };

  const button = (
    <div 
      ref={controlRef} 
      style={controlPosition}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onClick={onButtonClick}
        style={{
          backgroundColor: 'white',
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f7f7f7';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        }}
      >
        {/* Custom GeoJump Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Crosshairs/Target */}
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="#0066CC"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="#0066CC"
            strokeWidth="2"
            fill="#0066CC"
            fillOpacity="0.2"
          />
          {/* Crosshair lines */}
          <line
            x1="12"
            y1="2"
            x2="12"
            y2="6"
            stroke="#0066CC"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="12"
            y1="18"
            x2="12"
            y2="22"
            stroke="#0066CC"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="2"
            y1="12"
            x2="6"
            y2="12"
            stroke="#0066CC"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="18"
            y1="12"
            x2="22"
            y2="12"
            stroke="#0066CC"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Small "GJ" text badge */}
        <div
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            backgroundColor: '#0066CC',
            color: 'white',
            fontSize: '8px',
            fontWeight: 'bold',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          GJ
        </div>
      </div>
    </div>
  );

  return (
    <>
      {button}
      {isPopoverOpen && (
        <div
          style={{
            position: 'absolute',
            top: controlPosition.top === '12px' ? '52px' : 'auto',
            bottom: controlPosition.bottom === '32px' ? '72px' : 'auto',
            right: controlPosition.right === '12px' ? '0px' : 'auto',
            left: controlPosition.left === '12px' ? '0px' : 'auto',
            zIndex: 1004,
            width: '320px',
          }}
          onMouseEnter={handlePanelMouseEnter}
          onMouseLeave={handlePanelMouseLeave}
          // Prevent events from reaching the map underneath
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onDrag={(e) => e.stopPropagation()}
          onDragStart={(e) => e.stopPropagation()}
          onDragEnd={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <EuiPanel 
            paddingSize="s"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onDrag={(e) => e.stopPropagation()}
            onDragStart={(e) => e.stopPropagation()}
            onDragEnd={(e) => e.stopPropagation()}
            onSelect={(e) => e.stopPropagation()}
            onSelectStart={(e) => e.stopPropagation()}
            style={{ 
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <EuiTitle size="xs">
              <h4>
                {i18n.translate('geojump.mapControl.title', {
                  defaultMessage: 'Jump to Coordinates',
                })}
              </h4>
            </EuiTitle>
            <EuiSpacer size="s" />
            
            <EuiFormRow
              label={i18n.translate('geojump.mapControl.coordinatesLabel', {
                defaultMessage: 'Coordinates',
              })}
              helpText={i18n.translate('geojump.mapControl.coordinatesHelp', {
                defaultMessage: 'Enter lat, lon (e.g., 40.7128, -74.0060)',
              })}
            >
              <div
                style={{ 
                  userSelect: 'text',
                  position: 'relative',
                  zIndex: 1002,
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onDrag={(e) => e.stopPropagation()}
                onDragStart={(e) => e.stopPropagation()}
                onDragEnd={(e) => e.stopPropagation()}
                onSelect={(e) => e.stopPropagation()}
                onSelectStart={(e) => e.stopPropagation()}
              >
                <EuiFieldText
                  placeholder="40.7128, -74.0060"
                  value={coordinateInput}
                  onChange={(e) => setCoordinateInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onMouseMove={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onBlur={(e) => e.stopPropagation()}
                  onSelect={(e) => e.stopPropagation()}
                  onDrag={(e) => e.stopPropagation()}
                  onDragStart={(e) => e.stopPropagation()}
                  onDragEnd={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  compressed
                  style={{ 
                    userSelect: 'text', 
                    cursor: 'text',
                    position: 'relative',
                    zIndex: 1003,
                  }}
                />
              </div>
            </EuiFormRow>
            
            <EuiSpacer size="s" />
            
            <EuiFormRow
              label={i18n.translate('geojump.mapControl.zoomLabel', {
                defaultMessage: 'Zoom Level',
              })}
            >
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                onDrag={(e) => e.stopPropagation()}
                onDragStart={(e) => e.stopPropagation()}
                onDragEnd={(e) => e.stopPropagation()}
                style={{ userSelect: 'none' }}
              >
                <EuiFlexGroup alignItems="center" gutterSize="s">
                  <EuiFlexItem>
                    <EuiRange
                      min={1}
                      max={14}
                      value={zoomLevel}
                      onChange={(e) => setZoomLevel(parseInt(e.currentTarget.value, 10))}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onMouseMove={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                      showTicks
                      tickInterval={1}
                      compressed
                    />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" style={{ minWidth: '20px' }}>
                      {zoomLevel}
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </div>
            </EuiFormRow>
            
            <EuiSpacer size="s" />
            
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
              <EuiFlexItem>
                <EuiButton
                  fill
                  size="s"
                  onClick={handleJump}
                  isLoading={isJumping}
                  disabled={!coordinateInput.trim()}
                  iconType="crosshairs"
                >
                  {isJumping ? 'Jumping...' : 'Jump'}
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType="cross"
                  aria-label="Close"
                  onClick={closePopover}
                  size="s"
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </div>
      )}
    </>
  );
};
