import React from 'react';
import PropTypes from 'prop-types';

import './ErrorScreenCustom.scss';

const getTitle = (title, code) => title || ({
  404: 'Not Found',
  403: 'Access Restricted',
})[code];

const ErrorScreenCustom = ({ title, children, code, codeVisible = true }) => (
  <div className="ErrorScreen_custom">
    <div className="ErrorScreen__inner_custom">
      {codeVisible && <h1>{code}</h1>}
      <h2>{getTitle(title, code)}</h2>
      {children}
    </div>
  </div>
);

ErrorScreenCustom.propTypes = {
  title: PropTypes.string,
  code: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]),
  children: PropTypes.node,
  codeVisible: PropTypes.bool,
};

export default ErrorScreenCustom;
