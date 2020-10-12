import React, { useEffect } from 'react';
import queryString from 'querystringify';
import Immutable from 'immutable';
import { Provider } from 'react-redux';
import configureStore from '../store/configureStore';
import PrintProvider from './PrintProvider';
import IntlWrapper from './IntlWrapper';
import VisualisationViewerContainer from '../components/visualisation/VisualisationViewerContainer';
import DashboardViewer from '../components/dashboard/shared/DashboardViewer';
import LumenBranding from '../components/common/LumenBranding';
import { init as initAnalytics, trackPageView } from '../utilities/analytics';

const store = configureStore();
const filteredDashboardCondition = () => queryString.parse(location.search)['filter-dashboard'] === '0';

function PublicDashboardView({ data, immutableDatasets, onChangeFilter, env }) { // eslint-disable-line
  return (
    <Provider store={store}>
      <PrintProvider>
        <IntlWrapper>
          <div className="viewer" style={{ display: 'flex' }}>
            {data.dashboards ? (
              <DashboardViewer
                dashboard={data.dashboards[data.dashboardId]}
                visualisations={data.visualisations}
                datasets={immutableDatasets}
                metadata={data.metadata ? data.metadata : null}
                filteredDashboard={!filteredDashboardCondition()}
                onFilterValueChange={onChangeFilter}
                env={env}
              />
            ) : (
              <VisualisationViewerContainer
                visualisation={data.visualisations[data.visualisationId]}
                metadata={data.metadata ? data.metadata[data.visualisationId] : null}
                datasets={immutableDatasets}
                env={env}
              />
            )}
            <LumenBranding
              size={data.dashboards ? 'large' : 'small'}
            />
          </div>
        </IntlWrapper>
      </PrintProvider>
    </Provider>
  );
}

export default function PublicDashboard({ data, filterColumnsFetched, initialState, onChangeFilter }) { // eslint-disable-line
  const datasets = data.datasets;

  const immutableDatasets = {};

  // Transform datasets into immutable objects
  if (datasets != null) {
    Object.keys(datasets).forEach((key) => {
      let dataset = Immutable.fromJS(datasets[key]);

      if (!filteredDashboardCondition() && data.dashboards) {
        const datasetId = data.dashboards[data.dashboardId].filter.datasetId;

        if (key === datasetId && filterColumnsFetched) {
          dataset = filterColumnsFetched.reduce((d, { columnName, values }) => d.setIn(['columnsFetched', columnName], values), dataset);
        }
      }

      immutableDatasets[key] = dataset;
    });
  }


  useEffect(() => {
    const entity = data.dashboards ?
    data.dashboards[data.dashboardId] :
    data.visualisations[data.visualisationId];

    const entityType = data.dashboards ? 'dashboard' : 'visualisation';

    initAnalytics(initialState);
    trackPageView(`Share ${entityType}: ${entity.name || `Untitled ${entityType}`}`);
  }, []);


  return (
    <PublicDashboardView
      data={data}
      immutableDatasets={immutableDatasets}
      onChangeFilter={onChangeFilter}
      env={initialState.env}
    />
  );
}
