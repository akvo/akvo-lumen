import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import NavLink from './workspace-nav/NavLink';
import OrganizationMenu from './workspace-nav/OrganizationMenu';

require('./WorkspaceNav.scss');

const getActiveSubtitle = (pathname) => {
  let activeSubtitle;
  if (pathname === '/admin/users') {
    activeSubtitle = 'users';
  } else if (pathname === '/admin/resources') {
    activeSubtitle = 'resources';
  }

  return activeSubtitle;
};

const AdminNav = function AdminNav(props) {
  const activeSubtitle = getActiveSubtitle(props.location.pathname);
  return (
    <nav
      className="WorkspaceNav noSelect"
    >
      <div className="header">
        <div className="rowPrimary">
          <div
            className="menuIcon clickable"
          />
          <h1><Link to="/">Lumen</Link></h1>
        </div>
        <OrganizationMenu profile={props.profile} />
      </div>
      <div className="links">
        <NavLink
          to="/admin/users"
          className="users subtitle"
          isSelected={activeSubtitle === 'users'}
        >
          Users
        </NavLink>
        <div>
          <br />
        </div>
        <NavLink
          to="/admin/resources"
          className="resources subtitle"
          isSelected={activeSubtitle === 'resources'}
        >
          Resources
        </NavLink>
      </div>
      <div className="NavWorkspaceSwitch">
        {<Link to="/">Workspace</Link>}
      </div>
    </nav>
  );
};

AdminNav.propTypes = {
  profile: PropTypes.object.isRequired,
  location: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const collections = Object.keys(state.collections).map(key => state.collections[key]);
  return {
    collections,
    profile: state.profile,
  };
}

export default connect(
  mapStateToProps
)(AdminNav);
