import React, { useState, useCallback, useEffect } from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiFieldText,
  EuiButton,
  EuiSelect,
  EuiFormRow,
  EuiSpacer,
  EuiText,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSwitch,
  EuiRange,
  EuiIcon,
  EuiButtonIcon,
  EuiPopover,
  EuiCode,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { GeojumpService } from '../services/geojump_service';
import { GeojumpCoordinates, CoordinateFormat, DEFAULT_ZOOM_LEVEL } from '../../common';
import { CoordinateParser } from '../utils/coordinate_parser';

interface GeojumpPanelProps {
  geojumpService: GeojumpService;
  onJump?: (coordinates: GeojumpCoordinates) => void;
  compact?: boolean;
}

const coordinateFormatOptions = [
  {
    value: CoordinateFormat.DECIMAL_DEGREES,
    text: i18n.translate('geojump.coordinateFormat.decimalDegrees', {
      defaultMessage: 'Decimal Degrees',
    }),
  },
  {
    value: CoordinateFormat.DEGREES_MINUTES_SECONDS,
    text: i18n.translate('geojump.coordinateFormat.degreesMinutesSeconds', {
      defaultMessage: 'Degrees, Minutes, Seconds',
    }),
  },
  {
    value: CoordinateFormat.DEGREES_DECIMAL_MINUTES,
    text: i18n.translate('geojump.coordinateFormat.degreesDecimalMinutes', {
      defaultMessage: 'Degrees, Decimal Minutes',
    }),
  },
];

export const GeojumpPanel: React.FC<GeojumpPanelProps> = ({
  geojumpService,
  onJump,
  compact = false,
}) => {
  const [coordinateInput, setCoordinateInput] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(CoordinateFormat.DECIMAL_DEGREES);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);
  const [showMarker, setShowMarker] = useState(true);
  const [animateTransition, setAnimateTransition] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Validate input as user types
  useEffect(() => {
    if (!coordinateInput.trim()) {
      setError(null);
      setIsValid(false);
      return;
    }

    const validation = CoordinateParser.validateInput(coordinateInput);
    setIsValid(validation.isValid);
    setError(validation.error || null);
  }, [coordinateInput, geojumpService]);

  const handleJump = useCallback(() => {
    if (!isValid || !coordinateInput.trim()) {
      return;
    }

    const coordinates = geojumpService.parseCoordinates(coordinateInput);
    if (!coordinates) {
      setError('Unable to parse coordinates');
      return;
    }

    const jumpCoordinates: GeojumpCoordinates = {
      ...coordinates,
      zoom: zoomLevel,
    };

    geojumpService.jumpToCoordinates(jumpCoordinates, {
      showMarker,
      animateTransition,
      zoomLevel,
      debug: debugMode,
    });

    // Debug mode functionality removed to reduce console clutter

    if (onJump) {
      onJump(jumpCoordinates);
    }

    setError(null);
  }, [coordinateInput, isValid, zoomLevel, showMarker, animateTransition, geojumpService, onJump, debugMode]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && isValid) {
        handleJump();
      }
    },
    [handleJump, isValid]
  );

  // Event handlers to prevent map dragging when interacting with text inputs
  const handleInputFocus = useCallback((event: React.FocusEvent) => {
    event.stopPropagation();
  }, []);

  const handleInputMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  const handleInputMouseUp = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  const handleInputSelect = useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  const handleInputDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  const handleFormatChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = e.target.value as CoordinateFormat;
    setSelectedFormat(newFormat);
    geojumpService.emitFormatChanged(newFormat);
  }, [geojumpService]);

  const getExampleText = () => {
    switch (selectedFormat) {
      case CoordinateFormat.DECIMAL_DEGREES:
        return '40.7128, -74.0060';
      case CoordinateFormat.DEGREES_MINUTES_SECONDS:
        return '40°42\'46"N 74°0\'21"W';
      case CoordinateFormat.DEGREES_DECIMAL_MINUTES:
        return '40°42.767\'N 74°0.35\'W';
      default:
        return '40.7128, -74.0060';
    }
  };

  const helpContent = (
    <div 
      style={{ width: '300px' }}
      onMouseDown={handleInputMouseDown}
      onMouseUp={handleInputMouseUp}
      onSelect={handleInputSelect}
      onDoubleClick={handleInputDoubleClick}
    >
      <EuiText size="s">
        <h4>Supported Coordinate Formats:</h4>
        <ul>
          <li>
            <strong>Decimal Degrees:</strong>
            <br />
            <EuiCode>40.7128, -74.0060</EuiCode>
          </li>
          <li>
            <strong>Degrees, Minutes, Seconds:</strong>
            <br />
            <EuiCode>40°42'46"N 74°0'21"W</EuiCode>
          </li>
          <li>
            <strong>Degrees, Decimal Minutes:</strong>
            <br />
            <EuiCode>40°42.767'N 74°0.35'W</EuiCode>
          </li>
        </ul>
        <p>
          <strong>Tips:</strong>
        </p>
        <ul>
          <li>Use comma or space to separate latitude and longitude</li>
          <li>Negative values or S/W indicate southern/western coordinates</li>
          <li>Press Enter to jump after entering coordinates</li>
        </ul>
      </EuiText>
    </div>
  );

  if (compact) {
    return (
      <EuiFlexGroup gutterSize="s" alignItems="center">
        <EuiFlexItem>
          <EuiFieldText
            placeholder={`Enter coordinates (e.g., ${getExampleText()})`}
            value={coordinateInput}
            onChange={(e) => setCoordinateInput(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            onMouseDown={handleInputMouseDown}
            onMouseUp={handleInputMouseUp}
            onSelect={handleInputSelect}
            onDoubleClick={handleInputDoubleClick}
            isInvalid={!!error}
            compressed
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            fill
            onClick={handleJump}
            disabled={!isValid}
            iconType="crosshairs"
          >
            Jump
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiPopover
            button={
              <EuiButtonIcon
                iconType="questionInCircle"
                onClick={() => setIsHelpOpen(!isHelpOpen)}
                aria-label="Help"
              />
            }
            isOpen={isHelpOpen}
            closePopover={() => setIsHelpOpen(false)}
          >
            {helpContent}
          </EuiPopover>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  return (
    <EuiPanel paddingSize="m">
      <EuiFlexGroup alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiIcon type="crosshairs" size="l" />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size="s">
            <h3>
              {i18n.translate('geojump.panel.title', {
                defaultMessage: 'GeoJump',
              })}
            </h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiPopover
            button={
              <EuiButtonIcon
                iconType="questionInCircle"
                onClick={() => setIsHelpOpen(!isHelpOpen)}
                aria-label="Help"
              />
            }
            isOpen={isHelpOpen}
            closePopover={() => setIsHelpOpen(false)}
          >
            {helpContent}
          </EuiPopover>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiFormRow
        label={i18n.translate('geojump.coordinateFormat.label', {
          defaultMessage: 'Coordinate Format',
        })}
      >
        <EuiSelect
          options={coordinateFormatOptions}
          value={selectedFormat}
          onChange={handleFormatChange}
        />
      </EuiFormRow>

      <EuiSpacer size="m" />

      <EuiFormRow
        label={i18n.translate('geojump.coordinates.label', {
          defaultMessage: 'Coordinates',
        })}
        helpText={`Example: ${getExampleText()}`}
        isInvalid={!!error}
        error={error}
      >
        <EuiFieldText
          placeholder={i18n.translate('geojump.coordinates.placeholder', {
            defaultMessage: 'Enter latitude and longitude',
          })}
          value={coordinateInput}
          onChange={(e) => setCoordinateInput(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleInputFocus}
          onMouseDown={handleInputMouseDown}
          onMouseUp={handleInputMouseUp}
          onSelect={handleInputSelect}
          onDoubleClick={handleInputDoubleClick}
          isInvalid={!!error}
        />
      </EuiFormRow>

      <EuiSpacer size="m" />

      <EuiFormRow
        label={i18n.translate('geojump.zoomLevel.label', {
          defaultMessage: 'Zoom Level',
        })}
      >
        <EuiRange
          min={1}
          max={14}
          value={zoomLevel}
          onChange={(e) => setZoomLevel(parseInt(e.currentTarget.value, 10))}
          showTicks
          showValue
        />
      </EuiFormRow>

      <EuiSpacer size="m" />

      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('geojump.showMarker.label', {
              defaultMessage: 'Show marker',
            })}
            checked={showMarker}
            onChange={(e) => setShowMarker(e.target.checked)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('geojump.animateTransition.label', {
              defaultMessage: 'Animate transition',
            })}
            checked={animateTransition}
            onChange={(e) => setAnimateTransition(e.target.checked)}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />
      
      <EuiSwitch
        label={i18n.translate('geojump.debugMode.label', {
          defaultMessage: 'Debug mode',
        })}
        checked={debugMode}
        onChange={(e) => setDebugMode(e.target.checked)}
      />

      <EuiSpacer size="l" />

      <EuiButton
        fill
        fullWidth
        onClick={handleJump}
        disabled={!isValid}
        iconType="crosshairs"
      >
        {i18n.translate('geojump.jumpButton.label', {
          defaultMessage: 'Jump to Location',
        })}
      </EuiButton>

      {error && (
        <>
          <EuiSpacer size="m" />
          <EuiCallOut
            title={i18n.translate('geojump.error.title', {
              defaultMessage: 'Invalid Coordinates',
            })}
            color="danger"
            iconType="alert"
            size="s"
          >
            <p>{error}</p>
          </EuiCallOut>
        </>
      )}
    </EuiPanel>
  );
};
