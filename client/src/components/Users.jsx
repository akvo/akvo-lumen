import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import EntityTypeHeader from './entity-editor/EntityTypeHeader';
import InviteUser from './modals/InviteUser';
// import ConfirmUserAction from './modals/ConfirmUserAction';
import * as api from '../api';

require('../styles/EntityTypeHeader.scss');
require('../styles/Users.scss');

class UserActionSelector extends Component {
  constructor(props) {
    super(props);
    this.state = { action: '?' };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange(event) {
    this.setState({ action: event.target.value });
  }

  onSubmit() {
    const action = this.state.action;
    const userId = this.props.id;
    const url = `/api/admin/users/${userId}`;
    if (action === 'promote') {
      api.patch(url, { admin: true });
    } else if (action === 'demote') {
      api.patch(url, { admin: false });
    }
  }

  render() {
    const { active, admin } = this.props;
    return (
      <form
        className="userActionSelector"
        onSubmit={this.onSubmit}
      >
        <select
          onChange={this.onChange}
          value={this.state.action}
        >
          <option value="?">...</option>
          <option
            disabled={active}
            key="user-delete"
            value="delete"
          >
            Delete user
          </option>
          <option
            disabled={admin}
            key="user-promote"
            value="promote"
          >
            Enable admin privileges
          </option>
          <option
            disabled={(!admin || active)}
            key="user-demote"
            value="demote"
          >
            Remove admin privileges
          </option>
        </select>
        <input type="submit" value="Go" />
      </form>
    );
  }
}

UserActionSelector.propTypes = {
  active: PropTypes.bool.isRequired,
  admin: PropTypes.bool.isRequired,
  id: PropTypes.string.isRequired,
};

function User({ active, admin, email, id, username }) {
  return (
    <tr>
      <td>{username}</td>
      <td>{email}</td>
      <td>{admin ? 'Admin' : 'User'}</td>
      <td>
        <UserActionSelector
          active={active}
          admin={admin}
          id={id}
        />
      </td>
    </tr>
  );
}

User.propTypes = {
  active: PropTypes.bool.isRequired,
  admin: PropTypes.bool.isRequired,
  email: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
};

User.defaultProps = {
  admin: false,
};

function UserList({ activeUserId, users }) {
  return (
    <table>
      <tbody>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
        {users.map(({ admin, email, id, username }) => (
          <User
            active={id === activeUserId}
            admin={admin}
            email={email}
            id={id}
            key={username}
            username={username}
          />
        ))}
      </tbody>
    </table>
  );
}

UserList.propTypes = {
  activeUserId: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired,
};

class Users extends Component {

  constructor() {
    super();
    this.state = {
      isActionModalVisible: false,
      isInviteModalVisible: false,
      users: [],
    };
    this.getActionButtons = this.getActionButtons.bind(this);
    this.onInviteUser = this.onInviteUser.bind(this);
  }

  componentDidMount() {
    if (this.props.profile.admin) {
      api.get('/api/admin/users')
        .then(users => this.setState({ users }));
    }
  }

  onInviteUser(email) {
    this.setState({ isInviteModalVisible: false });
    api.post('/api/admin/invites', { email });
  }

  getActionButtons() {
    const buttons = [
      {
        buttonText: 'Manage invites',
        onClick: () => null,
      },
      {
        buttonText: 'Invite user',
        onClick: () => this.setState({ isInviteModalVisible: true }),
      },
    ];
    return buttons;
  }

  render() {
    const actionButtons = this.getActionButtons();
    const { admin, id } = this.props.profile;
    const saveStatus = '';
    const title = 'Members';

    if (!admin) {
      return (
        <div>
          <p>You need to be an admin user to view and invite other users.</p>
        </div>
      );
    }

    return (
      <div className="UsersContainer">
        <EntityTypeHeader
          title={title}
          saveStatus={saveStatus}
          actionButtons={actionButtons}
        />
        <div className="UserList">
          <UserList
            activeUserId={id}
            users={this.state.users}
          />
        </div>
        <InviteUser
          isOpen={this.state.isInviteModalVisible}
          onClose={() => this.setState({ isInviteModalVisible: false })}
          onInviteUser={this.onInviteUser}
        />
      </div>
    );
  }
}

export default connect(state => ({
  profile: state.profile,
}))(Users);

Users.propTypes = {
  profile: PropTypes.shape({
    admin: PropTypes.bool,
    id: PropTypes.string.isRequired,
  }).isRequired,
};
