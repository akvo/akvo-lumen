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
    };
  }

  getChildContext() {
    const { abbrNumber } = this.state;
    return { abbrNumber };
  }

  componentDidMount() {
    this.handleChangeLocale(this.props.locale);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.locale !== nextProps.locale) {
      this.handleChangeLocale(nextProps.locale);
    }
  }

  handleChangeLocale(locale) {
    if (!locale) return;

    numeral.locale(locale);

    this.setState({
      messages: getMessages(locale),
    });

    this.props.dispatch(changeLocale(locale));
  }

  render() {
    const { children, locale } = this.props;

    return (
      <IntlProvider locale={locale} messages={this.state.messages}>
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
  const { attributes } = state.profile;
  if (attributes && attributes.locale && typeof attributes.locale[0] === 'string') {
    return { locale: attributes.locale[0] };
  }
  return { locale: 'en' };
}

export default connect(
  mapStateToProps
)(IntlWrapper);
