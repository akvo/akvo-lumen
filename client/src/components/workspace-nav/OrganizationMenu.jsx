import React, { PropTypes } from 'react';

export default function OrganizationMenu({ user }) {
  return (
    <div className="OrganizationMenu">
      <div className="name">{user.name}</div>
      <div className="organization">{user.organization}</div>
    </div>
  );
}

OrganizationMenu.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    organization: PropTypes.string,
  }),
};
