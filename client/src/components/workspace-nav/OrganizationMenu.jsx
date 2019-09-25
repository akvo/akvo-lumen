import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import UserMenu from './user-menu/UserMenu';
import { isAuth0 } from '../../utilities/utils';

function KeycloakUserMenu({ profile, authURL }) {
  const url = `${authURL}/realms/akvo/account`;
  return (
    <div className="KeycloakUserMenu">
      <div className="name">
        <a href={url}>
          <i className="fa fa-user-o" aria-hidden="true" /> {profile.username}
        </a>
      </div>
      <div className="organization">Akvo Lumen</div>
    </div>
  );
}

KeycloakUserMenu.propTypes = {
  authURL: PropTypes.string,
  profile: PropTypes.shape({
    username: PropTypes.string,
  }).isRequired,
};

function OrganizationMenu({ profile, env }) {
  const { authURL } = env;
  return (
    <div className="OrganizationMenu">
      {isAuth0(env) ? (
        <UserMenu profile={profile} />
      ) : (
        <KeycloakUserMenu authURL={authURL} profile={profile} />
      )}
    </div>
  );
}

OrganizationMenu.propTypes = {
  env: PropTypes.shape({
    authURL: PropTypes.string.isRequired,
  }).isRequired,
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
