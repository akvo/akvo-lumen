import React from 'react';
import PropTypes from 'prop-types';

require('./LumenBranding.scss');

export default function LumenBranding({ size = 'large' }) {
  return (
    <div className={`LumenBranding ${size}`}>
      <span>
        Built with <span className="logoColor">Akvo Lumen</span>
      </span>
    </div>
  );
}

LumenBranding.propTypes = {
  size: PropTypes.string,
};
