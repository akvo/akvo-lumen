import React from 'react';
import PropTypes from 'prop-types';
import STATUS from '../../constants/status';

import './ListGroup.scss';

export const ListGroup = ({ children }) => (
  <ul className="ListGroup">
    {children}
  </ul>
);

ListGroup.propTypes = {
  children: PropTypes.node,
};

export const ListGroupItem = ({ children, lg, onClick, status, icon }) => (
  <li
    className={`ListGroupItem ${lg ? 'ListGroupItem--lg' : ''} ${onClick ? 'ListGroupItem--clickable' : ''} ${status ? `ListGroupItem--${status}` : ''}`}
    onClick={onClick || (() => {})}
  >
    {icon && (
      <i className={`ListGroupItem__icon fa fa-${icon}`} />
    )}
    {children}
  </li>
);

ListGroupItem.propTypes = {
  children: PropTypes.node,
  lg: PropTypes.bool,
  onClick: PropTypes.func,
  status: PropTypes.oneOf(Object.values(STATUS).concat(undefined)),
};
