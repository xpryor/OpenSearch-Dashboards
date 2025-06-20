import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../core/public';
import { AppPluginStartDependencies } from './types';
import { GeojumpApp } from './components/app';

export const renderApp = (
  { notifications, http }: CoreStart,
  { navigation, data, embeddable }: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <GeojumpApp
      basename={appBasePath}
      notifications={notifications}
      http={http}
      navigation={navigation}
      data={data}
      embeddable={embeddable}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
