import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router';
import './Header.scss';

function Header({ children, actions, router, className = '' }) {
  return (
    <nav className={`Header ${className}`}>
      <Link
        className="backButton"
        onClick={() => router.goBack()}
      >
        <i className="fa fa-arrow-left" aria-hidden="true" />
      </Link>
      <div className="content">
        {children}
      </div>
      <div className="actions">
        {actions}
      </div>
    </nav>
  );
}

Header.propTypes = {
  router: PropTypes.object.isRequired,
  children: PropTypes.node,
  actions: PropTypes.node,
  className: PropTypes.string,
};

export default withRouter(Header);
