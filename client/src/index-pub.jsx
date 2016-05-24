import React from 'react';
import { render } from 'react-dom';
import VisualisationPreview from './components/visualisation/VisualisationPreview';

require('./styles/reset.global.scss');
require('./styles/style.global.scss');

const rootElement = document.querySelector('#root');
const data = window.LUMEN_DATA;

render(
  <VisualisationPreview
    visualisation={data.visualisation}
    datasets={data.datasets}
  />,
  rootElement
);
