import React from 'react';
import PropTypes from 'prop-types';

import './Button.scss';

const Button = ({
  xs,
  sm,
  md,
  lg,
  primary,
  warning,
  danger,
  success,
  link,
  children,
  disabled,
  ...rest
}) => {
  let size;
  if (!xs && !sm && !lg) {
    size = 'md';
  } else {
    if (lg) size = 'lg';
    if (md) size = 'md';
    if (sm) size = 'sm';
    if (xs) size = 'xs';
  }
  let type;
  if (!primary && !warning && !danger && !success && !link) {
    type = 'default';
  } else {
    if (link) type = 'link';
    if (primary) type = 'primary';
    if (warning) type = 'warning';
    if (danger) type = 'danger';
    if (success) type = 'success';
  }

  if (disabled) type = 'disabled';

  return (
    <a
      {...rest}
      className={`Button Button--${type || 'default'} Button--${size || 'md'} ${rest.className ? rest.className : ''}`}
    >
      {children}
    </a>
  );
};

Button.propTypes = {
  xs: PropTypes.bool,
  sm: PropTypes.bool,
  md: PropTypes.bool,
  lg: PropTypes.bool,
  primary: PropTypes.bool,
  success: PropTypes.bool,
  danger: PropTypes.bool,
  warning: PropTypes.bool,
  link: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
};

export default Button;
