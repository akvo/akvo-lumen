import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import EntityTypeHeader from './entity-editor/EntityTypeHeader';
import ConfirmUserAction from './modals/ConfirmUserAction';
import InviteUser from './modals/InviteUser';
import * as api from '../api';

require('../styles/EntityTypeHeader.scss');
require('../styles/Users.scss');

function UserActionSelector({ user, onChange }) {
  const { active, admin } = user;
  return (
    <select
      className="UserActionSelector"
      onChange={event => onChange(user, event.target.value)}
      value="?"
    >
      <option value="?">...</option>
      <option disabled key="user-edit" value="edit">
        Edit
      </option>
      <option disabled={active} key="user-delete" value="delete">
        Delete
      </option>
      {!admin
         ?
           <option disabled={admin} key="user-promote" value="promote">
             Enable admin privileges
           </option>
         :
           <option disabled={(!admin || active)} key="user-demote" value="demote">
             Remove admin privileges
           </option>
      }
    </select>
  );
}

UserActionSelector.propTypes = {
  onChange: PropTypes.func.isRequired,
  user: PropTypes.shape({
    active: PropTypes.bool.isRequired,
    admin: PropTypes.bool.isRequired,
    email: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }),
};

function User({ onChange, user }) {
  const { active, admin, email, username } = user;
  return (
    <tr>
      <td>
        {username}
        {active
          ? <span className="isMe"> (me)</span>
          : <span />
        }
      </td>
      <td>{email}</td>
      <td>{admin ? 'Admin' : 'User'}</td>
      <td>
        <UserActionSelector
          onChange={onChange}
          user={user}
        />
      </td>
    </tr>
  );
}

User.propTypes = {
  onChange: PropTypes.func.isRequired,
  user: PropTypes.shape({
    active: PropTypes.bool.isRequired,
    admin: PropTypes.bool.isRequired,
    email: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
};

function UserList({ activeUserId, onChange, users }) {
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
            key={id}
            onChange={onChange}
            user={{
              active: id === activeUserId,
              admin,
              email,
              id,
              username }}
          />
        ))}
      </tbody>
    </table>
  );
}

UserList.propTypes = {
  activeUserId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  users: PropTypes.array.isRequired,
};

class Users extends Component {
  constructor() {
    super();
    this.state = {
      userAction: {
        action: '',
        email: '',
        id: '',
        username: '',
      },
      isActionModalVisible: false,
      isInviteModalVisible: false,
      users: [],
    };
    this.getActionButtons = this.getActionButtons.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.handleUserAction = this.handleUserAction.bind(this);
    this.handleUserActionSelect = this.handleUserActionSelect.bind(this);
    this.onInviteUser = this.onInviteUser.bind(this);
  }

  componentDidMount() {
    if (this.props.profile.admin) {
      this.getUsers();
    }
  }

  onInviteUser(email) {
    this.setState({ isInviteModalVisible: false });
    api.post('/api/admin/invites', { email })
      .then(response => response.json());
  }

  getUsers() {
    api.get('/api/admin/users')
      .then(response => response.json())
      .then(users => this.setState({ users }));
  }

  getActionButtons() {
    const buttons = [
      {
        buttonText: 'Manage invites',
        onClick: null,
      },
      {
        buttonText: 'Invite user',
        onClick: () => this.setState({ isInviteModalVisible: true }),
      },
    ];
    return buttons;
  }

  handleUserActionSelect({ id, username }, action) {
    this.setState({
      isActionModalVisible: true,
      userAction: { action, id, username },
    });
  }

  handleUserAction() {
    const { action, id } = this.state.userAction;
    this.setState({ isActionModalVisible: false });
    const url = `/api/admin/users/${id}`;
    if (action === 'delete') {
      api.del(url)
        .then(response => response.json())
        .then(() => this.getUsers());
    } else if (action === 'demote') {
      api.patch(url, { admin: false })
        .then(response => response.json())
        .then(() => this.getUsers());
    } else if (action === 'promote') {
      api.patch(url, { admin: true })
        .then(response => response.json())
        .then(() => this.getUsers());
    }
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
            onChange={this.handleUserActionSelect}
            users={this.state.users}
          />
        </div>
        <InviteUser
          isOpen={this.state.isInviteModalVisible}
          onClose={() => this.setState({ isInviteModalVisible: false })}
          onInviteUser={this.onInviteUser}
        />
        <ConfirmUserAction
          isOpen={this.state.isActionModalVisible}
          onChange={this.handleUserAction}
          onClose={() => this.setState({ isActionModalVisible: false })}
          user={this.state.userAction}
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
    email: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
};
