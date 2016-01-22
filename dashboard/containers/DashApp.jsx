import { Component } from 'react';
import React from 'react';
import { ReduxRouter } from 'redux-router'
import { Route } from 'react-router'
import Datasets from './Datasets';
import Visualisations from './Visualisations';
import Dashboards from './Dashboards';

class DashApp extends Component {
  render() {
    return (
      <ReduxRouter>
        <Route path="/" component={Datasets}>
          <Route path="datasets" component={Datasets} />
        </Route>
        <Route path="visualisations" component={Visualisations} />
        <Route path="dashboards" component={Dashboards} />
      </ReduxRouter>
    );
  }
};

export default DashApp;
