import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import numeral from 'numeral';
import { addLocaleData, IntlProvider } from 'react-intl';
import 'numeral/locales/fr';
import 'numeral/locales/es';
import fr from 'react-intl/locale-data/fr';
import en from 'react-intl/locale-data/en';
import es from 'react-intl/locale-data/es';
import enTranslations from '../translations/en.json';
import frTranslations from '../translations/fr.json';
import esTranslations from '../translations/es.json';
import { changeLocale } from '../actions/locale';

export const availableLocales = [{
  label: 'English',
  tag: 'en',
}, {
  label: 'Español',
  tag: 'es',
}, {
  label: 'Français',
  tag: 'fr',
}];

addLocaleData(en);
addLocaleData(fr);
addLocaleData(es);

const MESSAGES = {
  fr: frTranslations,
  es: esTranslations,
  en: enTranslations,
};

const getMessages = (locale = 'en') => MESSAGES[locale];

class IntlWrapper extends Component {

  constructor(props) {
    super(props);
    this.state = {
      abbrNumber: value => numeral(value).format('0.0a'),
      messages: getMessages(props.locale),
      locale: props.locale,
    };
  }

  getChildContext() {
    const { abbrNumber } = this.state;
    return { abbrNumber };
  }

  componentDidMount() {
    const { locale } = this.props;
    this.handleChangeLocale(locale);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.locale !== this.state.locale) {
      this.handleChangeLocale(this.state.locale);
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.locale !== prevState.locale) {
      return {
        messages: getMessages(nextProps.locale),
        locale: nextProps.locale,
      };
    }
    return null;
  }

  handleChangeLocale(locale) {
    if (!locale) return;
    numeral.locale(locale);
    this.props.dispatch(changeLocale(locale));
  }

  render() {
    const { children, locale } = this.props;
    return (
      <IntlProvider key={locale} locale={locale} messages={this.state.messages}>
        {children}
      </IntlProvider>
    );
  }
}

IntlWrapper.propTypes = {
  children: PropTypes.element.isRequired,
  locale: PropTypes.string.isRequired,
  dispatch: PropTypes.func,
};

IntlWrapper.childContextTypes = {
  abbrNumber: PropTypes.func,
};

function mapStateToProps(state) {
  const stateLocale = state.locale;
  if (stateLocale === null) { // locale in state?
    const userSelectedLocale = window.localStorage.getItem('locale');
    if (userSelectedLocale === null) { // locale in localstorage?
      const { attributes } = state.profile;
      if (attributes && attributes.locale && typeof attributes.locale[0] === 'string') { // locale from claims
        return { locale: attributes.locale[0] };
      }
      return { locale: 'en' }; // default to en
    }
    return { locale: userSelectedLocale };
  }
  return { locale: state.locale };
}

export default connect(
  mapStateToProps
)(IntlWrapper);
