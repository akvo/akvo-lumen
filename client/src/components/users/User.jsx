import React, { Component } from 'react';
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
  }),
};

UserActionSelector.defaultProps = {
  user: {
    admin: false,
    firstName: '',
  },
};

// eslint-disable-next-line max-len
//  { getUserActions, invitationMode, onChange, onCancelEditing, onSaveEditing, user, currentEdition }

class User extends Component {
  constructor(props) {
    super(props);
    const { user } = props;
    this.state = user;
    this.onEditUser = this.onEditUser.bind(this);
    this.onCancelEditUser = this.onCancelEditUser.bind(this);
  }

  onEditUser(n) {
    this.setState({
      firstName: n,
    });
  }
  onCancelEditUser() {
    this.setState(this.props.user);
  }

  render() {
    const { active, admin, email, firstName } = this.state;
    // eslint-disable-next-line max-len
    const { currentEdition, onCancelEditing, onSaveEditing, invitationMode, getUserActions, onChange, user } = this.props;
    const isEditing = currentEdition.email === email && currentEdition.action === 'edit';
    const cancel = u => () => { this.onCancelEditUser(); onCancelEditing(u); };
    const save = () => () => onSaveEditing(this.state);
    return (
      <tr>
        {!invitationMode &&
          <td>
            {isEditing ?
              <input
                className="entityTitleInput overflow"
                type="text"
                ref={`entityTitle${email}`}
                value={firstName}
                onChange={evt => this.onEditUser(evt.target.value)}
              /> :
              firstName}
            {active && <span className="isMe"> (me)</span>}
          </td>
        }
        <td>{email}</td>
        {!invitationMode && <td>{admin ? 'Admin' : 'User'}</td>}
        <td>
          {isEditing ?
            <div>
              <button
                className="overflow clickable "
                onClick={save(user)}
              >SAVE</button>&nbsp;
              <button
                className="overflow clickable "
                onClick={cancel(user)}
              >CANCEL</button>
            </div>
                :
            <UserActionSelector
              getUserActions={getUserActions}
              onChange={onChange}
              user={user}
            />
          }
        </td>
      </tr>
    );
  }
}

User.propTypes = {
  getUserActions: PropTypes.func.isRequired,
  invitationMode: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onCancelEditing: PropTypes.func.isRequired,
  onSaveEditing: PropTypes.func.isRequired,
  user: PropTypes.shape({
    active: PropTypes.bool.isRequired,
    admin: PropTypes.bool,
    email: PropTypes.string.isRequired,
    firstName: PropTypes.string,
  }).isRequired,
  currentEdition: PropTypes.object.isRequired,
};

User.defaultProps = {
  user: {
    admin: false,
    firstName: '',
  },
};

export default injectIntl(User);
