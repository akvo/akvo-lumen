import React from 'react';
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
          <FormattedMessage id="yikes" />
        </h1>
        <p>
          <FormattedMessage id="email_verified_error" />
        </p>
        <div className="footer">
          <hr />
          <p>
            <FormattedMessage id="having_trouble_signing_up" /> <FormattedMessage id="contact" /> <a href="mailto:support@akvo.org">support@akvo.org</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default connect()(EmailVerificationError);
