import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

function OrganizationMenu({ profile }) {
  return (
    <div className="OrganizationMenu">
      <div className="name">
        <a href="http://auth.lumen.localhost:8080/auth/realms/akvo/account">
          <i className="fa fa-user-o" aria-hidden="true" /> {profile.username}
        </a>
      </div>
      <div className="organization">Akvo Lumen</div>
    </div>
  );
}

OrganizationMenu.propTypes = {
  dispatch: PropTypes.func.isRequired,
  profile: PropTypes.shape({
    username: PropTypes.string,
  }).isRequired,
};

export default connect(() => ({}))(OrganizationMenu);
