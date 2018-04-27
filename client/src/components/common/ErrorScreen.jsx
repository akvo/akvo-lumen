import React from 'react';
import PropTypes from 'prop-types';

import './ErrorScreen.scss';

const getTitle = (title, code) => title || ({
  404: 'Not Found',
  403: 'Access Restricted',
})[code];

const ErrorScreen = ({ title, children, code }) => (
  <div className="ErrorScreen">
    <div className="ErrorScreen__inner">
      <h1>{code}</h1>
      <h2>{getTitle(title, code)}</h2>
      {children}
    </div>
  </div>
);

ErrorScreen.propTypes = {
  title: PropTypes.string,
  code: PropTypes.number,
  children: PropTypes.node,
};

export default ErrorScreen;
