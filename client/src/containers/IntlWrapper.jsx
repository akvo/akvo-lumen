import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addLocaleData, IntlProvider } from 'react-intl';
import fr from 'react-intl/locale-data/fr';
import en from 'react-intl/locale-data/en';
import es from 'react-intl/locale-data/es';
import enTranslations from '../translations/en.json';
import frTranslations from '../translations/fr.json';
import esTranslations from '../translations/es.json';

addLocaleData(en);
addLocaleData(fr);
addLocaleData(es);

function IntlWrapper({ locale, children }) {
  let messages;
  switch (locale) {
    case 'fr':
      messages = frTranslations;
      break;
    case 'es':
      messages = esTranslations;
      break;
    default:
      // Default to english
      messages = enTranslations;
      break;
  }

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
  const { attributes } = state.profile;
  if (attributes && attributes.locale && typeof attributes.locale[0] === 'string') {
    return { locale: attributes.locale[0] };
  }
  return { locale: 'en' };
}

export default connect(
  mapStateToProps
)(IntlWrapper);
