import React from 'react';
import PropTypes from 'prop-types';

require('./LumenBranding.scss');

export default function LumenBranding({ size = 'large' }) {
  return (
    <div className={`LumenBranding ${size}`}>
      <a
        href="https://akvo.org/products/akvo-lumen/#overview"
        target="_blank" // eslint-disable-line
      >
        Built with <span className="logoColor">Akvo Lumen</span>
      </a>
    </div>
  );
}

LumenBranding.propTypes = {
  size: PropTypes.string,
};
