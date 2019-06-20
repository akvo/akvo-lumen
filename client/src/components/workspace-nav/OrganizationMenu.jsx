import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

function OrganizationMenu({ profile, authURL }) {
  return (
    <div className="OrganizationMenu">
      <div className="name">
        <a href={`${authURL}/realms/akvo/account`}>
          <i className="fa fa-user-o" aria-hidden="true" /> {profile.username}
        </a>
      </div>
      <div className="organization">Akvo Lumen</div>
    </div>
  );
}

OrganizationMenu.propTypes = {
  authURL: PropTypes.string.isRequired,
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
