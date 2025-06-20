import { NavigationPublicPluginStart } from '../../navigation/public';
import { DataPublicPluginStart } from '../../data/public';
import { EmbeddableStart } from '../../embeddable/public';
import { GeojumpCoordinates, GeojumpOptions } from '../common';

export interface GeojumpPluginSetup {
  getGreeting: () => string;
}

export interface GeojumpPluginStart {
  jumpToCoordinates(coordinates: GeojumpCoordinates, options?: GeojumpOptions): void;
  parseCoordinates(input: string): GeojumpCoordinates | null;
  formatCoordinates(coordinates: GeojumpCoordinates, format: string): string;
  createEmbeddable(container: HTMLElement, options?: any): any;
  addMapControl(mapContainer: HTMLElement, options?: any): { destroy: () => void };
}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  embeddable: EmbeddableStart;
}

export interface GeojumpState {
  coordinates: GeojumpCoordinates | null;
  inputValue: string;
  format: string;
  isValid: boolean;
  error?: string;
}
