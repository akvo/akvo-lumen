import React from 'react';
import PropTypes from 'prop-types';
import { connect, Provider } from 'react-redux';
import IntlWrapper from './IntlWrapper';
import EmailVerificationError from '../components/error/EmailVerificationError';


require('../styles/reset.global.scss');
require('../styles/style.global.scss');
require('./Main.scss');

function Error(props) {
  const { error, locale, store } = props;

  return (
    <div>
      <Provider store={store}>
        <IntlWrapper locale={locale}>
          <div className="Main">
            <EmailVerificationError error={error} />
          </div>
        </IntlWrapper>
      </Provider>
    </div>
  );
}

Error.propTypes = {
  error: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
  store: PropTypes.object.isRequired,
};

export default connect()(Error);
