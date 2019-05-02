import React from 'react';
import PropTypes from 'prop-types';

import './ErrorScreen.scss';

const getTitle = (title, code) => title || ({
  404: 'Not Found',
  403: 'Access Restricted',
})[code];

const ErrorScreen = ({ title, children, code, codeVisible = true }) => (
  <div className="ErrorScreen">
    <div className="ErrorScreen__inner">
      {codeVisible && <h1>{code}</h1>}
      <h2>{getTitle(title, code)}</h2>
      {children}
    </div>
  </div>
);

ErrorScreen.propTypes = {
  title: PropTypes.string,
  code: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]),
  children: PropTypes.node,
  codeVisible: PropTypes.bool,
};

export default ErrorScreen;
