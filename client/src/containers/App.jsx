import React from 'react';
import PropTypes from 'prop-types';
import { Router, Route, IndexRedirect } from 'react-router';
import Library from '../components/Library';
import Visualisation from './Visualisation';
import Dataset from './Dataset';
import Dashboard from './Dashboard';
import Users from '../components/Users';
import Main from './Main';

export default function App({ history }) {
  return (
    <Router history={history}>
      <Route path="/" component={Main}>
        <IndexRedirect from="" to="library" />
        <Route path="library" component={Library} />
        <Route path="library/collections/:collectionId" component={Library} />
        <Route path="dataset/:datasetId" component={Dataset} />
        <Route path="visualisation/create" component={Visualisation} />
        <Route path="visualisation/:visualisationId" component={Visualisation} />
        <Route path="dashboard/create" component={Dashboard} />
        <Route path="dashboard/:dashboardId" component={Dashboard} />
        <Route path="admin/users" component={Users} />
      </Route>
    </Router>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired,
};
