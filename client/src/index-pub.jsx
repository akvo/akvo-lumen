import React from 'react';
import { render } from 'react-dom';
import Immutable from 'immutable';
import AsyncVisualisationViewer from './components/charts/AsyncVisualisationViewer';
import DashboardViewer from './components/dashboard/DashboardViewer';
import LumenBranding from './components/common/LumenBranding';

require('./styles/reset.global.scss');
require('./styles/style.global.scss');

const rootElement = document.querySelector('#root');
const data = window.LUMEN_DATA;
const datasets = data.datasets;
const immutableDatasets = {};

// Transform datasets into immutable objects
if (datasets != null) {
  Object.keys(datasets).forEach((key) => {
    const dataset = Immutable.fromJS(datasets[key]);
    immutableDatasets[key] = dataset;
  });
}

render(
  <div className="viewer">
    {data.dashboardId ?
      <DashboardViewer
        dashboard={data.dashboards[data.dashboardId]}
        visualisations={data.visualisations}
        datasets={immutableDatasets}
      /> : <AsyncVisualisationViewer
        visualisation={data.visualisations[data.visualisationId]}
        datasets={immutableDatasets}
      />
    }
    <LumenBranding />
  </div>,
  rootElement
);
