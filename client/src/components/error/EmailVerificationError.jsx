import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import IMAGES from '../../constants/images';

require('./EmailVerificationError.scss');

function EmailVerificationError() {
  return (
    <div className="EmailVerificationError">
      <div className="EmailVerificationErrorBox">
        <div className="logo">
          <img src={IMAGES.BRAND.logo} title="Welcome to Akvo Lumen" alt="Welcome to Akvo Lumen" />
        </div>
        <h1>
          <FormattedMessage id="sorry" />
        </h1>
        <p>
          <FormattedMessage id="email_verified_error" />
        </p>
        <div className="footer">
          <hr />
          <p>
            <span>
              Having trouble signing up? contact <a href="mailto:support@akvo.org">support@akvo.org</a>.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

EmailVerificationError.propTypes = {
  error: PropTypes.object.isRequired,
};

export default connect()(EmailVerificationError);
