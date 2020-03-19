import React from 'react';
import PropTypes from 'prop-types';
import { Router, Route, Redirect, Switch, useLocation } from 'react-router-dom';
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

function AdminUsers({location}){
  return <Main location={location} sidebar={<AdminNav/>} content={<Users/>}/>;
}

function AdminResources({location}){
  return <Main location={location} sidebar={<AdminNav/>} content={<Resources/>}/>;
}

export default function App({ store, history, query }) {
  const path = ['profile', 'https://akvo.org/app_metadata', 'lumen', 'features', 'filteredDashboard'];
  const filteredDashboard = !((store && _.get(store.getState(), path)) === false);
  const queryParsed = (query && JSON.parse(query)) || {};
  return (
    <IntlWrapper>
      <Router history={history}>
        <Redirect from="/admin" to="/admin/users" />
        <Switch>
          <Route path="/admin">
            <Switch>
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/resources" component={AdminResources} />
             </Switch>
          </Route>
        </Switch>
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
