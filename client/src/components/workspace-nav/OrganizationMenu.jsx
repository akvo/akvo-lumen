import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import UserMenu from './user-menu/UserMenu';

function OrganizationMenu({ profile }) {
  return (
    <div className="OrganizationMenu">
      <UserMenu profile={profile} />
    </div>
  );
}

OrganizationMenu.propTypes = {
  profile: PropTypes.shape({
    username: PropTypes.string,
  }).isRequired,
};

function mapStateToProps(state) {
  return {
    authURL: state.env.authURL,
    env: state.env,
  };
}

export default connect(mapStateToProps)(OrganizationMenu);
