import React, { PropTypes } from 'react';
import { Link } from 'react-router';

export default function NavLink({ className, isSelected, to }) {
  let classNames = 'NavLink';
  if (className) classNames += ` ${className}`;
  if (isSelected) classNames += ' selected';

  return (
    <Link
      className={classNames}
      to={to}
    >
      {to}
    </Link>
  );
}

NavLink.propTypes = {
  to: PropTypes.string,
  className: PropTypes.string,
  isSelected: PropTypes.bool,
};
