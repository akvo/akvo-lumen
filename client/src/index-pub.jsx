import React from 'react';
import { render } from 'react-dom';
import VisualisationPreview from './components/visualisation/VisualisationPreview';
import DashboardViewer from './components/dashboard/DashboardViewer';
import LumenBranding from './components/common/LumenBranding';

require('./styles/reset.global.scss');
require('./styles/style.global.scss');

const rootElement = document.querySelector('#root');
const data = window.LUMEN_DATA;

render(
  <div>
    {data.dashboard ?
      <DashboardViewer
        dashboard={data.dashboard}
        visualisations={data.visualisations}
        datasets={data.datasets}
      />
      :
      <VisualisationPreview
        visualisation={data.visualisation}
        datasets={data.datasets}
      />
    }
    <LumenBranding />
  </div>,
  rootElement
);
