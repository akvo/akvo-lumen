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
    <button
      type="button"
      onClick={handleLocaleSelection}
      className={classNames}
      data-value={locale.tag}
    >
      { locale.label }
    </button>
  );
};

LocaleSelectorItem.propTypes = {
  locale: PropTypes.object.isRequired,
  currentLocale: PropTypes.string.isRequired,
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
      const { dispatch } = this.props;
      dispatch(changeLocale(newLocale));
    }
  }

  render() {
    const { locale } = this.props;
    return (
      <div>
        {availableLocales.map(l => (
          <LocaleSelectorItem
            key={l.tag}
            locale={l}
            handleLocaleSelection={this.handleLocaleSelection}
            currentLocale={locale}
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
