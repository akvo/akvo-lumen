import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import queryString from 'querystringify';
import LoadingSpinner from './components/common/LoadingSpinner';
import PrivacyGate from './components/PrivacyGate';
import PublicDashboard from './containers/PublicDashboard';
import * as auth from './utilities/auth';


require('./styles/reset.global.scss');
require('./styles/style.global.scss');

const rootElement = document.querySelector('#root');
const pathMatch = window.location.pathname.match(/^\/s\/(.*)/);
const shareId = pathMatch != null ? pathMatch[1] : null;

const filteredDashboardCondition = () => queryString.parse(window.location.search)['filter-dashboard'] === '0';

function PublicApp() {
  const [hasSubmittedPassword, setHasSubmittedPassword] = useState(false);
  const [view, setView] = useState(null);

  // set default state
  const [appData, setAppData] = useState({
    data: {},
    filterColumnsFetched: [],
    initialState: {},
    onChangeFilter: () => null,
  });

  function renderErrorView() {
    setView('AUTH_ERROR');

    // if already in error screen, then show password incorrect
    if (view === 'AUTH_ERROR') {
      setHasSubmittedPassword(true);
    }

    return null;
  }

  function fetchFilterColumn(datasetId, columnName, columnType, password) {
    return fetch(`/share/${shareId}/dataset/${datasetId}/column/${columnName}?order=value`, { headers: { 'X-Password': password } })
      .then((response) => {
        if (response.status === 403) {
          return renderErrorView(); // eslint-disable-line
        }

        return response.json();
      })
      .then(body => ({
        columnName,
        values: body.map(o => o[1]),
      })
    );
  }

  function fetchDashboard(env, password) {
    return (queryParams, onChangeFilter, callbackReady) => {
      const url = `/share/${shareId}`;
      const urlWithOptionalParams = queryParams == null ? url : `${url}?query=${encodeURIComponent(queryParams)}`;

      fetch(urlWithOptionalParams, { headers: { 'X-Password': password } })
        .then((response) => {
          if (response.status === 403) {
            return renderErrorView();
          }

          if (view === 'AUTH_ERROR') {
            setView(null);
          }

          return response.json()
            .then((data) => {
              if (data) return data;
              throw Error(`NO DATA FOR: /share/${shareId}`);
            })
            .then((data) => {
              if (data.dashboardId) {
                const dashboard = data.dashboards[data.dashboardId];
                const datasetId = dashboard.filter.datasetId;
                const datasetKeys = new Set(Object.keys(data.datasets));

                if (!filteredDashboardCondition() && dashboard.filter.columns.length > 0) {
                  const columnsFetch = dashboard.filter.columns
                    .map(o => fetchFilterColumn(datasetId, o.column, password));

                  return Promise.all(columnsFetch).then((responses) => {
                    if (datasetKeys.has(dashboard.filter.datasetId)) {
                      return [data, responses];
                    }

                    return fetch(`/share/${shareId}/dataset/${datasetId}`, { headers: { 'X-Password': password } })
                      .then((resp) => {
                        if (resp.status === 403) {
                          return renderErrorView();
                        }

                        return resp.json();
                      })
                      .then((dataset) => {
                        const udpatedData = data;
                        udpatedData.datasets[dataset.id] = dataset;
                        return [udpatedData, responses];
                      });
                  });
                }
                return [data];
              }
              return [data];
            })
            .then(([data, filterColumnsFetched]) => {
              if (callbackReady) callbackReady();

              setAppData({
                data,
                filterColumnsFetched: filterColumnsFetched || [],
                initialState: { env },
                onChangeFilter,
              });
              setView('APP');
            })
            .catch((e) => {
              setView('NO_DATA');
              throw e;
            });
        });
    };
  }

  const fetchData = (password = undefined) => {
    auth.initPublic().then(({ env }) => {
      const onChangeFilter = fetchDashboard(env, password);
      onChangeFilter(null, onChangeFilter);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (view === 'AUTH_ERROR') {
    return <PrivacyGate hasSubmitted={hasSubmittedPassword} fetchData={fetchData} />;
  }

  if (view === 'NO_DATA') {
    return <p>No such public dashboard or visualisation</p>;
  }

  if (view === 'APP') {
    return <PublicDashboard {...appData} />;
  }

  return <LoadingSpinner />;
}

ReactDOM.render(<PublicApp />, rootElement);
