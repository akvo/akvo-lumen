import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import OrganizationMenu from './workspace-nav/OrganizationMenu';

class AdminNav extends Component {
  render() {
    return (
      <nav
        className="WorkspaceNav noSelect"
      >
        <div className="header">
          <div className="rowPrimary">
            <div
              className="menuIcon"
            />
            <h1><Link to="/">Lumen</Link></h1>
          </div>
          <OrganizationMenu profile={this.props.profile} />
        </div>
      </nav>

    );
  }
}

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
/*
export const AdminNav = () => (
  <h1>Admin</h1>
);

AdminNav.propTypes = {
  profile: PropTypes.object.isRequired,
  location: PropTypes.object,
};

export { AdminNav as default };
*/
