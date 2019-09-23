import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import IMAGES from '../../constants/images';

require('./EmailVerificationError.scss');

function EmailVerificationError(props) {
  const { error } = props;

  return (
    <div className="EmailVerificationError">
      <div className="logo">
        <img src={IMAGES.BRAND.logo} title="Welcome to Akvo Lumen" alt="Welcome to Akvo Lumen" />
      </div>
      <h1>
        <FormattedMessage id="email_verified_error" />
      </h1>
    </div>
  );
}

EmailVerificationError.propTypes = {
  error: PropTypes.object.isRequired,
};

export default connect()(EmailVerificationError);
