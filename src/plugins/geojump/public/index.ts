import './index.scss';

import { GeojumpPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new GeojumpPlugin();
}
export { GeojumpPluginSetup, GeojumpPluginStart } from './types';
