import React from 'react';
import PropTypes from 'prop-types';
import { IndexRedirect, Redirect, Router, Route } from 'react-router';
import _ from 'lodash';
import IntlWrapper from './IntlWrapper';
import Library from '../components/Library';
import Visualisation from './Visualisation';
import Dataset from './Dataset';
import Raster from './Raster';
import Transformation from './Transformation';
import Dashboard from './Dashboard';
import Dashboard2 from './Dashboard2';
import Dashboard2Export from './Dashboard2Export';
import Users from '../components/users/Users';
import Resources from '../components/Resources';
import Main from './Main';
import WorkspaceNav from '../components/WorkspaceNav';
import AdminNav from '../components/AdminNav';
import withProps from '../utilities/withProps';

export default function App({ history, location, store }) {
  // new Dashboard feature flag
  const { dashboard2 } = _.get(
      store.getState(),
      ['profile', 'https://akvo.org/app_metadata', 'lumen', 'features']);
  return (
    <IntlWrapper>
      <Router history={history}>
        <Route path="/" component={Main}>
          <Redirect from="auth_callback" to="/" />
          <IndexRedirect from="" to="library" />
          <Route
            path="library"
            components={{ sidebar: WorkspaceNav, content: Library }}
            location={location}
          />
          <Route
            path="library/collections/:collectionId"
            components={{ sidebar: WorkspaceNav, content: Library }}
            location={location}
          />
          <Route
            path="dataset/:datasetId"
            components={{ sidebar: WorkspaceNav, content: Dataset }}
            location={location}
          />
          <Route
            path="raster/:rasterId"
            components={{ sidebar: WorkspaceNav, content: Raster }}
            location={location}
          />
          <Route
            path="dataset/:datasetId/transformation/:transformationType"
            components={{ sidebar: WorkspaceNav, content: Transformation }}
            location={location}
          />
          <Route
            path="visualisation/create"
            components={{ sidebar: WorkspaceNav, content: Visualisation }}
            location={location}
          />
          <Route
            path="visualisation/:visualisationId/export"
            components={{
              sidebar: WorkspaceNav,
              content: withProps(Visualisation, { exporting: true }),
            }}
            location={location}
          />
          <Route
            path="visualisation/:visualisationId"
            components={{ sidebar: WorkspaceNav, content: Visualisation }}
            location={location}
          />
          <Route
            path="dashboard/create"
            components={{
              sidebar: WorkspaceNav,
              content: dashboard2 ? Dashboard2 : Dashboard2 }}
            location={location}
          />
          <Route
            path="dashboard/:dashboardId/export_pages"
            components={{
              sidebar: WorkspaceNav,
              content: withProps(Dashboard, { exporting: true, preventPageOverlaps: true }),
            }}
            location={location}
          />
          <Route
            path="dashboard/:dashboardId/export"
            components={{
              sidebar: WorkspaceNav,
              content: withProps(Dashboard, { exporting: true }),
            }}
            location={location}
          />
          <Route
            path="dashboard/:dashboardId"
            components={{
              sidebar: WorkspaceNav,
              content: dashboard2 ? Dashboard2 : Dashboard,
            }}
            location={location}
          />
          <Redirect from="admin" to="/admin/users" />
          <Route
            path="admin/users"
            components={{ sidebar: AdminNav, content: Users }}
            location={location}
          />
          <Route
            path="admin/resources"
            components={{ sidebar: AdminNav, content: Resources }}
            location={location}
          />
        </Route>
        <Route
          path="dashboard2/:dashboardId/export"
          component={Dashboard2Export}
          location={location}
        />
      </Router>
    </IntlWrapper>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object,
  store: PropTypes.object,
};
