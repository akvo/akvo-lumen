import React, { PropTypes } from 'react';
import { Router, Route, IndexRedirect } from 'react-router';
import Library from '../components/Library';
import Visualisation from './Visualisation';
import Dataset from './Dataset';
import Dashboards from '../components/Dashboards';
import Main from '../components/Main';

export default function App({ history }) {
  return (
    <Router history={history}>
      <Route path="/" component={Main}>
        <IndexRedirect from="" to="library" />
        <Route path="library" component={Library} />
        <Route path="library/:collection" component={Library} />
        <Route path="dataset/:datasetId" component={Dataset} />
        <Route path="visualisation/create" component={Visualisation} />
        <Route path="visualisation/:visualisationId" component={Visualisation} />
        <Route path="dashboards" component={Dashboards} />
      </Route>
    </Router>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired,
};
