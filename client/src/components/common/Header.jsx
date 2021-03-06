import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import './Header.scss';

function Header({
  children,
  actions,
  primaryActions,
  history,
  className = '',
  backButtonTarget,
  location,
  collectionHistory,
}) {
  const haveHistory = location.state && location.state.from;
  let target;
  let isLink = false;
  if (backButtonTarget) {
    target = { to: backButtonTarget };
    isLink = true;
  } else if (haveHistory) {
    target = { onClick: () => history.goBack() };
  } else {
    isLink = true;
    if (collectionHistory.location.length > 0) {
      target = { to: collectionHistory.location };
    } else {
      target = { to: '/library' };
    }
  }
  const Arrow = () => (
    <i
      className="fa fa-arrow-left"
      aria-hidden="true"
    />);

  return (
    <nav className={`Header ${className}`}>
      { isLink ?
        (<Link
          className="backButton"
          data-test-id="back-button"
          {...target}
        >
          <Arrow />
        </Link>) :
        (<div
          className="backButton"
          data-test-id="back-button"
          {...target}
        >
          <Arrow />
        </div>)}
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

const mapStateToProps = (state) => {
  const { collectionHistory } = state;
  return { collectionHistory };
};

Header.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object,
  collectionHistory: PropTypes.object,
  backButtonTarget: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
  primaryActions: PropTypes.node,
  className: PropTypes.string,
};

export default connect(mapStateToProps, null)(withRouter(Header));
