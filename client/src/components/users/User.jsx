import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

function UserActionSelector({ getUserActions, onChange, user }) {
  const actions = getUserActions(user);
  return (
    <select
      className="UserActionSelector"
      onChange={event => onChange(user, event.target.value)}
      value="?"
    >
      <option value="?">...</option>
      {actions.map(([value, text, disabled]) => (
        <option disabled={disabled} key={value} value={value}>{text}</option>
      ))}
    </select>
  );
}

UserActionSelector.propTypes = {
  getUserActions: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  user: PropTypes.shape({
    active: PropTypes.bool.isRequired,
    admin: PropTypes.bool,
    email: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
  }),
};

UserActionSelector.defaultProps = {
  user: {
    admin: false,
    firstName: '',
    lastName: '',
  },
};

function User({ getUserActions, invitationMode, onChange, user }) {
  const { active, admin, email, firstName, lastName } = user;
  return (
    <tr>
      {!invitationMode &&
        <td>
          {firstName}
          {active && <span className="isMe"> (me)</span>}
        </td>
      }
      <td>{lastName}</td>
      <td>{email}</td>
      {!invitationMode && <td>{admin ? 'Admin' : 'User'}</td>}
      <td>
        <UserActionSelector
          getUserActions={getUserActions}
          onChange={onChange}
          user={user}
        />
      </td>
    </tr>
  );
}

User.propTypes = {
  getUserActions: PropTypes.func.isRequired,
  invitationMode: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  user: PropTypes.shape({
    active: PropTypes.bool.isRequired,
    admin: PropTypes.bool,
    email: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
  }).isRequired,
};

User.defaultProps = {
  user: {
    admin: false,
    firstName: '',
    lastName: '',
  },
};

export default injectIntl(User);
