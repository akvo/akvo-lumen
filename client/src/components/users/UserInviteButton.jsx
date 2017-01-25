import React, { PropTypes } from 'react';
import SelectMenu from '../common/SelectMenu';

const options = [
  { value: 'send-invitation', label: 'Send invitation' },
];

export default function UserInviteButton({ onInvite }) {
  return (
    <div className="UserInviteButton">
      <SelectMenu
        name="user-invite-button"
        options={options}
        onChange={onInvite}
        placeholder="Invite User"
      />
    </div>
  );
}

UserInviteButton.propTypes = {
  onInvite: PropTypes.func.isRequired,
};
