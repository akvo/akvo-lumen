import React, { PropTypes } from 'react';
import SelectMenu from '../common/SelectMenu';

const options = [
  { value: 'send-invitation', label: 'Send invitation' },
];

export default function UserInviteButton({ onCreate }) {
  return (
    <div className="UserInviteButton">
      <SelectMenu
        name="user-invite-button"
        options={options}
        onChange={onCreate}
        placeholder="Invite User"
      />
    </div>
  );
}

UserInviteButton.propTypes = {
  onCreate: PropTypes.func.isRequired,
};
