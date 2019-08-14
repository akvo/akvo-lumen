import React from 'react';
import PropTypes from 'prop-types';

require('./LocaleSelector.scss');

const availableLocales = [{
  label: 'English',
  tag: 'en',
}, {
  label: 'Espanol',
  tag: 'es',
}, {
  label: 'Francais',
  tag: 'fr',
}];

const LocaleSelectorItem = ({ locale, currentLocale, setLocale }) => {
  const styleClasses = ['LocaleSelectorItem'];
  if (locale.tag === currentLocale) {
    styleClasses.push('LocaleSelectorItemSelected');
  }
  const classNames = styleClasses.join(' ');
  return (
    <a onClick={setLocale} className={classNames} data-value={locale.tag}>
      { locale.label }
    </a>
  );
};

LocaleSelectorItem.propTypes = {
  locale: PropTypes.object,
  currentLocale: PropTypes.string,
  setLocale: PropTypes.func.isRequired,
};

class LocaleSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = { locale: 'en' };
    this.setLocale = this.setLocale.bind(this);
  }

  setLocale(e) {
    const newLocale = e.currentTarget.dataset.value;
    this.setState({
      locale: newLocale,
    });
  }

  render() {
    const currentLocale = this.state.locale;
    return (
      <div>
        {availableLocales.map(locale => (
          <LocaleSelectorItem
            key={locale.tag}
            locale={locale}
            setLocale={this.setLocale}
            currentLocale={currentLocale}
          />
        ))}
      </div>
    );
  }
}

LocaleSelector.propTypes = {
  profile: PropTypes.object,
};

export default LocaleSelector;
