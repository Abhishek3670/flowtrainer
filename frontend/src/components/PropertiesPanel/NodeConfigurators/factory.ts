// frontend/src/components/PropertiesPanel/NodeConfigurators/factory.ts

import { FC } from 'react';
import VideoStreamConfigurator from './VideoStreamConfigurator';
import DatasetUploadConfigurator from './DatasetUploadConfigurator';
import GenericConfigurator from './GenericConfigurator';

// Map nodeType to configurator component
const configuratorMap: Record<string, FC<any>> = {
  'video-stream': VideoStreamConfigurator,
  'dataset-upload': DatasetUploadConfigurator,
  // add other nodeType keys here as you implement them
};

// Factory to retrieve configurator
export class NodeConfiguratorFactory {
  static getConfigurator(nodeType: string): FC<any> {
    return configuratorMap[nodeType] || GenericConfigurator;
  }
}
