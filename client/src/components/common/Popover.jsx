import React from 'react';
import PropTypes from 'prop-types';

import './Popover.scss';

const getYTransform = (placement) => {
  switch (placement) {
    case 'right':
    case 'left':
      return 'translateY(-50%)';
    case 'top':
    case 'top-left':
    case 'top-right':
      return 'translateY(-100%)';
    default:
      return '';
  }
};
const getXTransform = (placement) => {
  switch (placement) {
    case 'left':
    case 'top-left':
    case 'bottom-left':
      return 'translateX(-100%)';
    case 'top':
    case 'bottom':
      return 'translateX(-50%)';
    default:
      return '';
  }
};
const getMarginLeft = (placement) => {
  switch (placement) {
    case 'top-left':
    case 'bottom-left':
      return 14;
    case 'top-right':
    case 'bottom-right':
      return -14;
    default:
      return 0;
  }
};

const Popover = ({
  title,
  children,
  placement = '',
  left,
  top,
  className = '',
  style = {},
  hideArrow = false,
  footer,
}) => (
  <div className="Popover">
    <div
      className={`popover fade show bs-popover-${placement.split('-')[0]} ${className} popover-${placement}`}
      role="tooltip"
      style={{
        left,
        top,
        transform: `${getXTransform(placement)} ${getYTransform(placement)}`,
        marginLeft: getMarginLeft(placement),
        ...style,
      }}
    >
      {!hideArrow && <div className="arrow" />}
      {title && <h3 className="popover-header">{title}</h3>}
      <div className="popover-body">{children}</div>
      {footer && <div className="popover-footer">{footer}</div>}
    </div>
  </div>
);

Popover.propTypes = {
  title: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
  placement: PropTypes.string,
  className: PropTypes.string,
  left: PropTypes.number,
  top: PropTypes.number,
  style: PropTypes.object,
  hideArrow: PropTypes.bool,
};

export default Popover;
