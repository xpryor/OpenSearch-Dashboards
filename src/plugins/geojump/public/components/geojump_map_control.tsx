import React, { useState, useRef, useEffect } from 'react';
import {
  EuiPopover,
  EuiButtonIcon,
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiPortal,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { GeojumpPanel } from './geojump_panel';
import { GeojumpService } from '../services/geojump_service';

interface GeojumpMapControlProps {
  mapContainer: HTMLElement;
  position?: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
  onJump?: (coordinates: any) => void;
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
  const controlRef = useRef<HTMLDivElement>(null);
  const geojumpServiceRef = useRef<GeojumpService>(new GeojumpService());
  const [controlPosition, setControlPosition] = useState<React.CSSProperties>({});

  // Calculate position based on the map container
  useEffect(() => {
    if (!mapContainer) return;

    const rect = mapContainer.getBoundingClientRect();
    const positionStyles: Record<string, React.CSSProperties> = {
      topRight: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
      },
      topLeft: {
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
      },
      bottomRight: {
        position: 'absolute',
        bottom: '30px',
        right: '10px',
        zIndex: 1000,
      },
      bottomLeft: {
        position: 'absolute',
        bottom: '30px',
        left: '10px',
        zIndex: 1000,
      },
    };

    setControlPosition(positionStyles[position]);
  }, [mapContainer, position]);

  const onButtonClick = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  const handleJump = (coordinates: any) => {
    if (onJump) {
      onJump(coordinates);
    }
    // Keep the popover open after jumping
  };

  const button = (
    <div ref={controlRef} style={controlPosition}>
      <EuiButtonIcon
        display="base"
        iconType="mapMarker"
        aria-label="GeoJump"
        onClick={onButtonClick}
        style={{
          backgroundColor: 'white',
          width: '32px',
          height: '32px',
          borderRadius: '4px',
          boxShadow: '0 1px 5px rgba(0,0,0,0.65)',
        }}
      />
    </div>
  );

  return (
    <>
      {button}
      {isPopoverOpen && (
        <EuiPortal>
          <div
            style={{
              position: 'absolute',
              top: controlPosition.top === '10px' ? '50px' : 'auto',
              bottom: controlPosition.bottom === '30px' ? '70px' : 'auto',
              right: controlPosition.right === '10px' ? '10px' : 'auto',
              left: controlPosition.left === '10px' ? '10px' : 'auto',
              zIndex: 1001,
              width: '300px',
            }}
          >
            <EuiPanel paddingSize="s">
              <EuiTitle size="xs">
                <h4>
                  {i18n.translate('geojump.mapControl.title', {
                    defaultMessage: 'Jump to Coordinates',
                  })}
                </h4>
              </EuiTitle>
              <EuiSpacer size="s" />
              <GeojumpPanel
                geojumpService={geojumpServiceRef.current}
                onJump={handleJump}
                compact={true}
              />
              <EuiSpacer size="s" />
              <EuiButtonIcon
                iconType="cross"
                aria-label="Close"
                onClick={closePopover}
                style={{ position: 'absolute', top: '8px', right: '8px' }}
              />
            </EuiPanel>
          </div>
        </EuiPortal>
      )}
    </>
  );
};
