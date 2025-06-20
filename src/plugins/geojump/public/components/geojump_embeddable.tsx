import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { GeojumpPanel } from './geojump_panel';
import { MapIntegration } from './map_integration';
import { GeojumpService } from '../services/geojump_service';

interface GeojumpEmbeddableProps {
  container: HTMLElement;
  compact?: boolean;
  onJump?: (coordinates: any) => void;
}

/**
 * Embeddable version of GeoJump that can be integrated into dashboards
 */
export class GeojumpEmbeddable {
  private geojumpService: GeojumpService;
  private container: HTMLElement;
  private props: GeojumpEmbeddableProps;

  constructor(props: GeojumpEmbeddableProps) {
    this.props = props;
    this.container = props.container;
    this.geojumpService = new GeojumpService();
    this.render();
  }

  private render() {
    const GeojumpEmbeddableComponent = () => {
      return (
        <div>
          <GeojumpPanel
            geojumpService={this.geojumpService}
            onJump={this.props.onJump}
            compact={this.props.compact}
          />
          <MapIntegration
            geojumpService={this.geojumpService}
          />
        </div>
      );
    };

    ReactDOM.render(<GeojumpEmbeddableComponent />, this.container);
  }

  public jumpToCoordinates(coordinates: any, options?: any) {
    this.geojumpService.jumpToCoordinates(coordinates, options);
  }

  public destroy() {
    ReactDOM.unmountComponentAtNode(this.container);
    this.geojumpService.destroy();
  }
}

// Factory function for creating embeddable instances
export const createGeojumpEmbeddable = (props: GeojumpEmbeddableProps): GeojumpEmbeddable => {
  return new GeojumpEmbeddable(props);
};
