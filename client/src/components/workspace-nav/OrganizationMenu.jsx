import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as auth from './../../utilities/auth';

function OrganizationMenu({ profile, authURL }) {
  const url = (authURL && authURL.includes('auth0')) ? 'https://manage.auth0.com' : `${authURL}/realms/akvo/account`;
  const logout = (authURL && authURL.includes('auth0')) ? <a onClick={() => auth.logout()}>&nbsp; <i className="fa fa-power-off" aria-hidden="true" /> LOGOUT</a> : '';
  return (
    <div className="OrganizationMenu">
      <div className="name">
        <a href={url}>
          <i className="fa fa-user-o" aria-hidden="true" /> {profile.username}
        </a>
        {logout}
      </div>
      <div className="organization">Akvo Lumen</div>
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
