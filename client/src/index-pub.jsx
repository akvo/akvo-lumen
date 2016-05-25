import React from 'react';
import { render } from 'react-dom';
import VisualisationPreview from './components/visualisation/VisualisationPreview';
import LumenBranding from './components/common/LumenBranding';

require('./styles/reset.global.scss');
require('./styles/style.global.scss');

const rootElement = document.querySelector('#root');
const data = window.LUMEN_DATA;

render(
  <div>
    <VisualisationPreview
      visualisation={data.visualisation}
      datasets={data.datasets}
    />
    <LumenBranding />
  </div>,
  rootElement
);
