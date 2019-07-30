import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import UserMenu from './user-menu/UserMenu';

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

function OrganizationMenu({ profile, authURL }) {
  const isAuth0 = (authURL && authURL.includes('auth0'));
  return (
    <div className="OrganizationMenu">
      {isAuth0 ? (
        <UserMenu profile={profile} />
      ) : (
        <KeycloakUserMenu authURL={authURL} profile={profile} />
      )}
    </div>
  );
}

OrganizationMenu.propTypes = {
  authURL: PropTypes.string,
  profile: PropTypes.shape({
    username: PropTypes.string,
  }).isRequired,
};

function mapStateToProps(state) {
  return {
    authURL: state.env.authURL,
  };
}

export default connect(mapStateToProps)(OrganizationMenu);
