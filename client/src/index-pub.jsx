import React from 'react';
import { render } from 'react-dom';
import Immutable from 'immutable';
import AsyncDashChart from './components/charts/AsyncDashChart';
import DashboardViewer from './components/dashboard/DashboardViewer';
import LumenBranding from './components/common/LumenBranding';

require('./styles/reset.global.scss');
require('./styles/style.global.scss');

const rootElement = document.querySelector('#root');
const data = window.LUMEN_DATA;
const datasets = data.datasets;
const immutableDatasets = {};

// Transform datasets into immutable objects
Object.keys(datasets).forEach(key => {
  const dataset = Immutable.fromJS(datasets[key]);
  immutableDatasets[key] = dataset;
});

render(
  <div className="viewer">
    {data.dashboard ?
      <DashboardViewer
        dashboard={data.dashboard}
        visualisations={data.visualisations}
        datasets={immutableDatasets}
      />
      :
      <AsyncDashChart
        visualisation={data.visualisation}
        datasets={immutableDatasets}
      />
    }
    <LumenBranding />
  </div>,
  rootElement
);
