import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addLocaleData, IntlProvider } from 'react-intl';
import fr from 'react-intl/locale-data/fr';
import en from 'react-intl/locale-data/en';
import enTranslations from '../translations/en.json';
import frTranslations from '../translations/fr.json';

addLocaleData(fr, en);

function IntlWrapper({ locale, children }) {
  const messages = locale === 'en' ? enTranslations : frTranslations;

  return (
    <IntlProvider locale={locale} messages={messages}>
      {children}
    </IntlProvider>
  );
}

IntlWrapper.propTypes = {
  children: PropTypes.element.isRequired,
  locale: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
  return {
    locale: state.translations.language,
  };
}

export default connect(
  mapStateToProps
)(IntlWrapper);
