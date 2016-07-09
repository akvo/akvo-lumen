import React from 'react';
import { render } from 'react-dom';
import AsyncDashChart from './components/charts/AsyncDashChart';
import DashboardViewer from './components/dashboard/DashboardViewer';
import LumenBranding from './components/common/LumenBranding';

require('./styles/reset.global.scss');
require('./styles/style.global.scss');

const rootElement = document.querySelector('#root');
const data = window.LUMEN_DATA;

render(
  <div className="viewer">
    {data.dashboard ?
      <DashboardViewer
        dashboard={data.dashboard}
        visualisations={data.visualisations}
        datasets={data.datasets}
      />
      :
      <AsyncDashChart
        visualisation={data.visualisation}
        datasets={data.datasets}
      />
    }
    <LumenBranding />
  </div>,
  rootElement
);
