import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import './Header.scss';

function Header({
  children,
  actions,
  primaryActions,
  router,
  className = '',
  backButtonTarget,
  location,
}) {
  const haveHistory = location.state && location.state.from;
  let target;

  if (backButtonTarget) {
    target = { to: backButtonTarget };
  } else if (haveHistory) {
    target = { onClick: () => router.goBack() };
  } else {
    target = { to: '/library' };
  }

  return (
    <nav className={`Header ${className}`}>
      <Link
        className="backButton"
        data-test-id="back-button"
        {...target}
      >
        <i
          className="fa fa-arrow-left"
          aria-hidden="true"
        />
      </Link>
      <div className="content">
        {children}
      </div>
      <div className="primary-actions">
        {primaryActions}
      </div>
      <div className="actions">
        {actions}
      </div>
    </nav>
  );
}

Header.propTypes = {
  router: PropTypes.object.isRequired,
  location: PropTypes.object,
  backButtonTarget: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
  primaryActions: PropTypes.node,
  className: PropTypes.string,
};

export default withRouter(Header);
