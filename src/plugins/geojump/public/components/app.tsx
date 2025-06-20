import React, { useState, useEffect, useRef } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
  EuiButton,
  EuiHorizontalRule,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageHeader,
  EuiTitle,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiCallOut,
  EuiTabs,
  EuiTab,
  EuiCode,
} from '@elastic/eui';

import { CoreStart } from '../../../../core/public';
import { NavigationPublicPluginStart } from '../../../navigation/public';
import { DataPublicPluginStart } from '../../../data/public';
import { EmbeddableStart } from '../../../embeddable/public';

import { PLUGIN_ID, PLUGIN_NAME } from '../../common';
import { GeojumpPanel } from './geojump_panel';
import { MapIntegration } from './map_integration';
import { GeojumpService } from '../services/geojump_service';

interface GeojumpAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  embeddable: EmbeddableStart;
}

export const GeojumpApp = ({ 
  basename, 
  notifications, 
  http, 
  navigation,
  data,
  embeddable 
}: GeojumpAppDeps) => {
  const [selectedTab, setSelectedTab] = useState('geojump');
  const [recentJumps, setRecentJumps] = useState<any[]>([]);
  const geojumpServiceRef = useRef<GeojumpService | null>(null);

  // Initialize geojump service
  useEffect(() => {
    geojumpServiceRef.current = new GeojumpService();
    
    // Subscribe to jump events to track recent jumps
    const subscription = geojumpServiceRef.current.getEvents().subscribe((event) => {
      if (event?.type === 'geojump:jumpToCoordinates') {
        const { coordinates } = event.payload;
        setRecentJumps(prev => [
          {
            coordinates,
            timestamp: new Date().toISOString(),
            id: Date.now(),
          },
          ...prev.slice(0, 9), // Keep last 10 jumps
        ]);
        
        // Show success notification
        notifications.toasts.addSuccess({
          title: i18n.translate('geojump.jumpSuccess.title', {
            defaultMessage: 'Jumped to location',
          }),
          text: i18n.translate('geojump.jumpSuccess.text', {
            defaultMessage: 'Coordinates: {lat}, {lon}',
            values: {
              lat: coordinates.lat.toFixed(6),
              lon: coordinates.lon.toFixed(6),
            },
          }),
        });
      }
    });

    return () => {
      subscription.unsubscribe();
      geojumpServiceRef.current?.destroy();
    };
  }, [notifications]);

  const handleJump = (coordinates: any) => {
    console.log('Jumped to coordinates:', coordinates);
  };

  const handleRecentJumpClick = (jump: any) => {
    if (geojumpServiceRef.current) {
      geojumpServiceRef.current.jumpToCoordinates(jump.coordinates);
    }
  };

  const tabs = [
    {
      id: 'geojump',
      name: i18n.translate('geojump.tabs.geojump', {
        defaultMessage: 'GeoJump',
      }),
    },
    {
      id: 'recent',
      name: i18n.translate('geojump.tabs.recent', {
        defaultMessage: 'Recent Jumps',
      }),
    },
    {
      id: 'help',
      name: i18n.translate('geojump.tabs.help', {
        defaultMessage: 'Help',
      }),
    },
  ];

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'geojump':
        return (
          <div>
            {geojumpServiceRef.current && (
              <>
                <GeojumpPanel
                  geojumpService={geojumpServiceRef.current}
                  onJump={handleJump}
                />
                <MapIntegration
                  geojumpService={geojumpServiceRef.current}
                />
              </>
            )}
          </div>
        );

      case 'recent':
        return (
          <div>
            <EuiTitle size="s">
              <h3>
                {i18n.translate('geojump.recentJumps.title', {
                  defaultMessage: 'Recent Jumps',
                })}
              </h3>
            </EuiTitle>
            <EuiSpacer size="m" />
            
            {recentJumps.length === 0 ? (
              <EuiCallOut
                title={i18n.translate('geojump.recentJumps.empty.title', {
                  defaultMessage: 'No recent jumps',
                })}
                iconType="mapMarker"
              >
                <p>
                  {i18n.translate('geojump.recentJumps.empty.description', {
                    defaultMessage: 'Your recent coordinate jumps will appear here.',
                  })}
                </p>
              </EuiCallOut>
            ) : (
              <div>
                {recentJumps.map((jump) => (
                  <div key={jump.id} style={{ marginBottom: '12px' }}>
                    <EuiFlexGroup alignItems="center" gutterSize="s">
                      <EuiFlexItem>
                        <EuiText size="s">
                          <strong>
                            {jump.coordinates.lat.toFixed(6)}, {jump.coordinates.lon.toFixed(6)}
                          </strong>
                          <br />
                          <span style={{ color: '#69707D' }}>
                            {new Date(jump.timestamp).toLocaleString()}
                          </span>
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButton
                          size="s"
                          onClick={() => handleRecentJumpClick(jump)}
                          iconType="crosshairs"
                        >
                          Jump Again
                        </EuiButton>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiHorizontalRule margin="s" />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'help':
        return (
          <div>
            <EuiTitle size="s">
              <h3>
                {i18n.translate('geojump.help.title', {
                  defaultMessage: 'How to use GeoJump',
                })}
              </h3>
            </EuiTitle>
            <EuiSpacer size="m" />
            
            <EuiText>
              <h4>Getting Started</h4>
              <p>
                GeoJump allows you to quickly navigate to specific geographic locations on maps 
                by entering coordinates in various formats.
              </p>
              
              <h4>Supported Coordinate Formats</h4>
              <ul>
                <li>
                  <strong>Decimal Degrees:</strong> <EuiCode>40.7128, -74.0060</EuiCode>
                </li>
                <li>
                  <strong>Degrees, Minutes, Seconds:</strong> <EuiCode>40°42'46"N 74°0'21"W</EuiCode>
                </li>
                <li>
                  <strong>Degrees, Decimal Minutes:</strong> <EuiCode>40°42.767'N 74°0.35'W</EuiCode>
                </li>
              </ul>
              
              <h4>Features</h4>
              <ul>
                <li><strong>Multiple Format Support:</strong> Enter coordinates in the format you prefer</li>
                <li><strong>Zoom Control:</strong> Set the zoom level for your jump destination</li>
                <li><strong>Visual Markers:</strong> Optionally show a marker at the jump location</li>
                <li><strong>Smooth Transitions:</strong> Animate the map movement to the new location</li>
                <li><strong>Recent Jumps:</strong> Quickly return to previously visited coordinates</li>
              </ul>
              
              <h4>Integration with Maps</h4>
              <p>
                GeoJump automatically detects and integrates with existing map visualizations 
                in your dashboards. It works with:
              </p>
              <ul>
                <li>Tile Map visualizations</li>
                <li>Region Map visualizations</li>
                <li>Custom map embeddables</li>
                <li>Third-party mapping libraries (Mapbox, Leaflet)</li>
              </ul>
              
              <h4>Tips</h4>
              <ul>
                <li>Use comma or space to separate latitude and longitude in decimal format</li>
                <li>Negative values or S/W directions indicate southern/western coordinates</li>
                <li>Press Enter after typing coordinates to jump immediately</li>
                <li>Adjust zoom level before jumping for better context</li>
              </ul>
            </EuiText>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Router basename={basename}>
      <I18nProvider>
        <>
          <navigation.ui.TopNavMenu
            appName={PLUGIN_ID}
            showSearchBar={false}
            useDefaultBehaviors={true}
          />
          <EuiPage restrictWidth="1200px">
            <EuiPageBody component="main">
              <EuiPageHeader>
                <EuiTitle size="l">
                  <h1>
                    <FormattedMessage
                      id="geojump.helloWorldText"
                      defaultMessage="{name}"
                      values={{ name: PLUGIN_NAME }}
                    />
                  </h1>
                </EuiTitle>
              </EuiPageHeader>
              <EuiPageContent>
                <EuiPageContentHeader>
                  <EuiTitle>
                    <h2>
                      <FormattedMessage
                        id="geojump.subtitle"
                        defaultMessage="Jump to any location on your maps using coordinates"
                      />
                    </h2>
                  </EuiTitle>
                </EuiPageContentHeader>
                <EuiPageContentBody>
                  <EuiTabs>
                    {tabs.map((tab) => (
                      <EuiTab
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                        isSelected={tab.id === selectedTab}
                      >
                        {tab.name}
                      </EuiTab>
                    ))}
                  </EuiTabs>
                  
                  <EuiSpacer size="l" />
                  
                  <div>
                    {renderTabContent()}
                  </div>
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
