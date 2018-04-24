import React, { Component } from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import Immutable from 'immutable';
import fetch from 'isomorphic-fetch';
import IntlWrapper from './containers/IntlWrapper';
import VisualisationViewerContainer from './components/visualisation/VisualisationViewerContainer';
import DashboardViewer from './components/dashboard/DashboardViewer';
import LumenBranding from './components/common/LumenBranding';
import ErrorScreen from './components/common/ErrorScreen';
import polyfill from './polyfill/polyfill';
import configureStore from './store/configureStore';

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
    <Provider store={configureStore()}>
      <IntlWrapper>
        <div className="viewer">
          {data.dashboards ?
            <DashboardViewer
              dashboard={data.dashboards[data.dashboardId]}
              visualisations={data.visualisations}
              datasets={immutableDatasets}
              metadata={data.metadata ? data.metadata : null}
            />
              :
              <VisualisationViewerContainer
                visualisation={data.visualisations[data.visualisationId]}
                metadata={data.metadata ? data.metadata[data.visualisationId] : null}
                datasets={immutableDatasets}
              />
          }
          <LumenBranding
            size={data.dashboards ? 'large' : 'small'}
          />
        </div>
      </IntlWrapper>
    </Provider>,
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

const fetchData = (password = undefined) => {
  fetch(`/share/${shareId}`, { headers: { 'X-Password': password } })
    .then(response => response.json())
    .then(data => renderSuccessfulShare(data))
    .catch((error) => {
      if (error.status === 403) {
        renderPrivacyGate(); // eslint-disable-line
      }
      renderNoSuchShare();
      throw error;
    });
};

class PrivacyGate extends Component {
  render() {
    return (
      <ErrorScreen code={403}>
        <form onSubmit={(event) => { event.preventDefault(); }}>
          <input
            onChange={({ target: { value } }) => {
              this.setState({ password: value });
            }}
            type="password"
            placeholder="Password"
          />
          <a
            className="submitButton"
            onClick={() => {
              fetchData(this.state.password);
            }}
          >
            Submit
          </a>
        </form>
      </ErrorScreen>
    );
  }
}

function renderPrivacyGate() {
  render(<PrivacyGate />, rootElement);
}

if (shareId != null) {
  polyfill(fetchData);
}
