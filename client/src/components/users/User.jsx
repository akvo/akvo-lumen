import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

require('./User.scss');

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
    currentUser: PropTypes.bool.isRequired,
    admin: PropTypes.bool,
    id: PropTypes.string.isRequired,
  }),
};

UserActionSelector.defaultProps = {
  user: {
    admin: false,
  },
};

function User({
  getUserActions, invitationMode, onChange, user,
  }) {
  const {
    currentUser, admin, email, firstName, lastName,
  } = user;
  return (
    <tr>
      {!invitationMode
      && (
        <td>
          {currentUser
          && (
            <span className="isMe">
              <i className="fa fa-user-o userIcon" aria-hidden="true" />
            </span>
          )}
        </td>
      )}
      {!invitationMode
      &&
        <td>{firstName}</td>
      }
      {!invitationMode
      &&
        <td>{lastName}</td>
      }
      <td>{email}</td>
      {!invitationMode &&
        <td className="UserRole">{admin ? <FormattedMessage id="admin" /> : <FormattedMessage id="user" />}</td>
      }
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
    currentUser: PropTypes.bool.isRequired,
    admin: PropTypes.bool,
    email: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
  }).isRequired,
};

User.defaultProps = {
  invitationMode: false,
};

export default injectIntl(User);
