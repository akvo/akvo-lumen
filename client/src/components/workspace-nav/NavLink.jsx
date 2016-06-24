import React, { PropTypes } from 'react';
import { Link } from 'react-router';

export default function NavLink({ className, isSelected, to, children }) {
  let classNames = 'NavLink';
  if (className) classNames += ` ${className}`;
  if (isSelected) classNames += ' selected';
  return (
    <Link
      className={classNames}
      to={to}
    >
      {children}
    </Link>
  );
}

NavLink.propTypes = {
  to: PropTypes.string.isRequired,
  className: PropTypes.string,
  isSelected: PropTypes.bool,
  children: PropTypes.string.isRequired,
};
