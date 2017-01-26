import React, { PropTypes } from 'react';

export default function UserInviteButton({ onUserInvite }) {
  return (
    <button
      className="overflow clickable"
      onClick={onUserInvite}
    >
    Invite User
    </button>
  );
}

UserInviteButton.propTypes = {
  onUserInvite: PropTypes.func.isRequired,
};
