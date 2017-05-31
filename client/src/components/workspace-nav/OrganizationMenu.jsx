import React from 'react';
import PropTypes from 'prop-types';

export default function OrganizationMenu({ profile }) {
  return (
    <div className="OrganizationMenu">
      <div className="name"><i className="fa fa-user-o" aria-hidden="true"></i> {profile.username}</div>
      <div className="organization">Akvo Lumen</div>
    </div>
  );
}

OrganizationMenu.propTypes = {
  profile: PropTypes.shape({
    username: PropTypes.string,
  }).isRequired,
};
