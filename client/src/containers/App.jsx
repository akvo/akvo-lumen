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
import Dashboard from '../components/dashboard/Dashboard';
import Users from '../components/users/Users';
import Resources from '../components/Resources';
import Main from './Main';
import WorkspaceNav from '../components/WorkspaceNav';
import AdminNav from '../components/AdminNav';
import withProps from '../utilities/withProps';

export default function App({ store, history, location }) {
  const path = ['profile', 'https://akvo.org/app_metadata', 'lumen', 'features'];
  const { filteredDashboard } = _.get(store.getState(), path);

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
            components={{ sidebar: WorkspaceNav,
              content: withProps(Dashboard, { filteredDashboard }) }}
            location={location}
          />
          <Route
            path="dashboard/:dashboardId/export_pages"
            components={{
              sidebar: WorkspaceNav,
              content: withProps(Dashboard,
                { filteredDashboard, exporting: true, preventPageOverlaps: true }),
            }}
            location={location}
          />
          <Route
            path="dashboard/:dashboardId/export"
            components={{
              sidebar: WorkspaceNav,
              content: withProps(Dashboard, { filteredDashboard, exporting: true }),
            }}
            location={location}
          />
          <Route
            path="dashboard/:dashboardId"
            components={{ sidebar: WorkspaceNav,
              content: withProps(Dashboard, { filteredDashboard }) }}
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
      </Router>
    </IntlWrapper>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object,
  store: PropTypes.object,
};
