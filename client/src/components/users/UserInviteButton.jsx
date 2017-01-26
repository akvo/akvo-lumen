import React, { PropTypes } from 'react';

export default function UserInviteButton({ onUserInviteToggle }) {
  return (
    <button
      className="overflow clickable"
      onClick={onUserInviteToggle}
    >
    Invite User
    </button>
  );
}

UserInviteButton.propTypes = {
  onUserInviteToggle: PropTypes.func.isRequired,
};
