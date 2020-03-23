import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
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
  console.log('AdminNav props', props);
  const location = useLocation();
  const activeSubtitle = getActiveSubtitle(location.pathname);
  return (
    <nav
      className="WorkspaceNav noSelect"
    >
      <div className="header">
        <div className="rowPrimary">
          <h1><Link to="/">Lumen</Link></h1>
        </div>
        <OrganizationMenu profile={props.profile} />
      </div>
      <div className="links">
        <ul>
          <li>
            <NavLink
              to="/admin/users"
              className="users subtitle"
              isSelected={activeSubtitle === 'users'}
            >
              <FormattedMessage id="users" />
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/resources"
              className="resources subtitle"
              isSelected={activeSubtitle === 'resources'}
            >
              <FormattedMessage id="resources" />
            </NavLink>
          </li>
        </ul>
      </div>
      <div className="NavWorkspaceSwitch">
        {<Link to="/">Workspace</Link>}
      </div>
    </nav>
  );
};

AdminNav.propTypes = {
  profile: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    profile: state.profile,
  };
}

export default connect(
  mapStateToProps
)(AdminNav);
