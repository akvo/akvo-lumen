import React from 'react';
import PropTypes from 'prop-types';
import { Router, Route, Redirect } from 'react-router-dom';
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
import { getQueryString } from '../utilities/api';

function admin(C) {
  // eslint-disable-next-line react/prop-types
  return ({ location, history }) =>
    <Main location={location} sidebar={<AdminNav />} content={<C history={history} />} />;
}

function resource(C, componentProps) {
  // eslint-disable-next-line react/prop-types
  return ({ location, match, history }) => {
    const props = componentProps || {};
    return (
      <Main
        location={location}
        sidebar={
          <WorkspaceNav
            location={location}
          />}
        content={
          <C
            params={match.params}
            location={location}
            history={history}
            {...props}
          />}
      />);
  };
}

export default function App({ store, history, query }) {
  const path = ['profile', 'https://akvo.org/app_metadata', 'lumen', 'features', 'filteredDashboard'];
  const filteredDashboard = !((store && _.get(store.getState(), path)) === false);
  const queryParsed = (query && JSON.parse(query)) || {};

  return (
    <IntlWrapper>
      <Router history={history}>
        <Route path="/admin" exact >
          <Redirect to="/admin/users" />
        </Route>
        <Route path="/auth_callback" exact >
          <Redirect to="/" />
        </Route>
        <Route path="/" exact >
          <Redirect to={{ pathname: '/library', search: `?${getQueryString(queryParsed)}` }} />
        </Route>

        <Route path="/admin/users" exact component={admin(Users)} />
        <Route path="/admin/resources" exact component={admin(Resources)} />
        <Route path="/library" exact component={resource(Library, { filteredDashboard })} />
        <Route path="/library/collections/:collectionId" component={resource(Library, { filteredDashboard })} />
        <Route path="/dataset/:datasetId" exact component={resource(Dataset)} />
        <Route path="/raster/:rasterId" component={resource(Raster)} />
        <Route
          path="/dataset/:datasetId/transformation/:transformationType"
          exact
          component={resource(Transformation)}
        />
        <Route path="/visualisation//create" exact component={resource(Visualisation)} />
        <Route path="/visualisation/:visualisationId" exact component={resource(Visualisation)} />

        <Route
          path="/visualisation/:visualisationId/export"
          exact
          component={resource(Visualisation, { exporting: true })}
        />

        <Route path="/dashboard//create" exact component={resource(Dashboard, { filteredDashboard })} />

        <Route
          path="/dashboard/:dashboardId/export_pages"
          exact
          component={resource(Dashboard,
            { query: queryParsed,
              filteredDashboard,
              exporting: true,
              preventPageOverlaps: true })}
        />

        <Route
          path="/dashboard/:dashboardId/export" exact
          componen={resource(Dashboard, { query: queryParsed, filteredDashboard, exporting: true })}
        />

        <Route path="/dashboard/:dashboardId" exact component={resource(Dashboard, { filteredDashboard })} />
      </Router>
    </IntlWrapper>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object,
  store: PropTypes.object,
  query: PropTypes.string,
};
