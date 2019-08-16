import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { availableLocales } from '../../../containers/IntlWrapper';
import { changeLocale } from '../../../actions/locale';

require('./LocaleSelector.scss');


const LocaleSelectorItem = ({ locale, currentLocale, handleLocaleSelection }) => {
  const styleClasses = ['LocaleSelectorItem'];
  if (locale.tag === currentLocale) {
    styleClasses.push('LocaleSelectorItemSelected');
  }
  const classNames = styleClasses.join(' ');
  return (
    <button onClick={handleLocaleSelection} className={classNames} data-value={locale.tag}>
      { locale.label }
    </button>
  );
};

LocaleSelectorItem.propTypes = {
  locale: PropTypes.object,
  currentLocale: PropTypes.string,
  handleLocaleSelection: PropTypes.func.isRequired,
};

class LocaleSelector extends React.Component {
  constructor(props) {
    super(props);
    this.handleLocaleSelection = this.handleLocaleSelection.bind(this);
  }

  handleLocaleSelection(e) {
    const currentLocale = this.props.locale;
    const newLocale = e.currentTarget.dataset.value;
    if (currentLocale !== newLocale) {
      window.localStorage.setItem('locale', newLocale);
      this.props.dispatch(changeLocale(newLocale));
    }
  }

  render() {
    const currentLocale = this.props.locale;
    return (
      <div>
        {availableLocales.map(locale => (
          <LocaleSelectorItem
            key={locale.tag}
            locale={locale}
            handleLocaleSelection={this.handleLocaleSelection}
            currentLocale={currentLocale}
          />
        ))}
      </div>
    );
  }
}

LocaleSelector.propTypes = {
  locale: PropTypes.string,
  dispatch: PropTypes.func,
};

function mapStateToProps(state) {
  return {
    locale: state.locale,
  };
}
export default connect(mapStateToProps)(LocaleSelector);
