import React from 'react';
import { render } from 'react-dom';
import Immutable from 'immutable';
import fetch from 'isomorphic-fetch';
import VisualisationViewerContainer from './components/visualisation/VisualisationViewerContainer';
import DashboardViewer from './components/dashboard/DashboardViewer';
import LumenBranding from './components/common/LumenBranding';

require('./styles/reset.global.scss');
require('./styles/style.global.scss');

const rootElement = document.querySelector('#root');

function renderSuccessfulShare(data) {
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
      {data.dashboards ?
        <DashboardViewer
          dashboard={data.dashboards[data.dashboardId]}
          visualisations={data.visualisations}
          datasets={immutableDatasets}
        />
          :
        <VisualisationViewerContainer
          visualisation={data.visualisations[data.visualisationId]}
          datasets={immutableDatasets}
        />
      }
      <LumenBranding
        size={data.dashboards ? 'large' : 'small'}
      />
    </div>,
    rootElement
  );
}

function renderNoSuchShare() {
  render(
    <div>No such public dashboard or visualisation</div>,
    rootElement
  );
}

const pathMatch = window.location.pathname.match(/^\/s\/(.*)/);
const shareId = pathMatch != null ? pathMatch[1] : null;

if (shareId != null) {
  fetch(`/share/${shareId}`)
    .then(response => response.json())
    .then(data => renderSuccessfulShare(data))
    .catch(() => renderNoSuchShare());
}
