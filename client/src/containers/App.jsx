import React, { PropTypes } from 'react';
import { Router, Route, IndexRedirect, Redirect } from 'react-router';
import Library from '../components/Library';
import Visualisation from './Visualisation';
import Dataset from './Dataset';
import Dashboard from './Dashboard';
import Users from '../components/Users';
import Main from './Main';
import WorkspaceNav from '../components/WorkspaceNav';
import AdminNav from '../components/AdminNav';

export default function App({ history, location }) {
  return (
    <Router history={history}>
      <Route path="/" component={Main}>
        <IndexRedirect to="library" />
        <Route
          path="library"
          components={{ sidebar: WorkspaceNav, content: Library }}
          location={location}
        />
        <Route
          path="library/:collection"
          components={{ sidebar: WorkspaceNav, content: Library }}
          location={location}
        />
        <Route
          path="dataset/:datasetId"
          components={{ sidebar: WorkspaceNav, content: Dataset }}
          location={location}
        />
        <Route
          path="visualisation/create"
          components={{ sidebar: WorkspaceNav, content: Visualisation }}
          location={location}
        />
        <Route
          path="visualisation/:visualisationId"
          components={{ sidebar: WorkspaceNav, content: Visualisation }}
          location={location}
        />
        <Route
          path="dashboard/create"
          components={{ sidebar: WorkspaceNav, content: Dashboard }}
          location={location}
        />
        <Route
          path="dashboard/:dashboardId"
          components={{ sidebar: WorkspaceNav, content: Dashboard }}
          location={location}
        />
        <Redirect from="admin" to="/admin/users" />
        <Route
          path="admin/users"
          components={{ sidebar: AdminNav, content: Users }}
          location={location}
        />
      </Route>
    </Router>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired,
};
