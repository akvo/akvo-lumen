import React from 'react';
import PropTypes from 'prop-types';

export default function OrganizationMenu({ profile }) {
  return (
    <div className="OrganizationMenu">
      <div className="name">{profile.username}</div>
      <div className="organization">Akvo Lumen</div>
    </div>
  );
}

OrganizationMenu.propTypes = {
  profile: PropTypes.shape({
    username: PropTypes.string,
  }).isRequired,
};
