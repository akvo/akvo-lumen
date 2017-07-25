import React from 'react';
import PropTypes from 'prop-types';
import { Router, Route, IndexRedirect } from 'react-router';
import { addLocaleData, IntlProvider } from 'react-intl';
import { connect } from 'react-redux';
import fr from 'react-intl/locale-data/fr';
import en from 'react-intl/locale-data/en';
import Library from '../components/Library';
import Visualisation from './Visualisation';
import Dataset from './Dataset';
import Dashboard from './Dashboard';
import Users from '../components/Users';
import Main from './Main';
import enTranslations from '../translations/en.json';
import frTranslations from '../translations/fr.json';

addLocaleData(fr, en);

function App({ history, translations }) {
  const locale = translations.language;

  const messages = locale === 'en' ? enTranslations : frTranslations;

  return (
    <IntlProvider locale={locale} messages={messages}>
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
    </IntlProvider>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired,
  translations: PropTypes.any,
};


function mapStateToProps(state) {
  return {
    translations: state.translations,
  };
}

export default connect(mapStateToProps)(App);
