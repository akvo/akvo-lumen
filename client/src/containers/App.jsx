import React, { PropTypes } from 'react';
import { Router, Route, IndexRedirect } from 'react-router';
import Library from '../components/Library';
import Visualisation from './Visualisation';
import Dataset from './Dataset';
import Dashboard from './Dashboard';
import Users from '../components/Users';
import Main from './Main';
import WorkspaceNav from '../components/WorkspaceNav';
import AdminNav from '../components/AdminNav';

export default function App({ history }) {
  return (
    <Router history={history}>
      <Route path="/" component={Main}>
        <IndexRedirect from="" to="library" />
        <Route
          path="library"
          components={{ navigation: WorkspaceNav, content: Library }}
        />
        <Route
          path="library/:collection"
          components={{ navigation: WorkspaceNav, content: Library }}
        />
        <Route
          path="dataset/:datasetId"
          components={{ navigation: WorkspaceNav, content: Dataset }}
        />
        <Route
          path="visualisation/create"
          components={{ navigation: WorkspaceNav, content: Visualisation }}
        />
        <Route
          path="visualisation/:visualisationId"
          components={{ navigation: WorkspaceNav, content: Visualisation }}
        />
        <Route
          path="dashboard/create"
          components={{ navigation: WorkspaceNav, content: Dashboard }}
        />
        <Route
          path="dashboard/:dashboardId"
          components={{ navigation: WorkspaceNav, content: Dashboard }}
        />
        <Route
          path="admin/users"
          components={{ navigation: AdminNav, content: Users }}
        />
      </Route>
    </Router>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired,
};
