import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import EntityTypeHeader from './entity-editor/EntityTypeHeader';
import InviteUser from './modals/InviteUser';
import * as api from '../api';

require('../styles/EntityTypeHeader.scss');
require('../styles/Users.scss');

class UserActionSelector extends Component {
  constructor(props) {
    super(props);
    this.state = { action: '?' };
    this.onChange = this.onChange.bind(this);
  }

  onChange(event) {
    const action = event.target.value;
    const userId = this.props.userId;
    this.setState({ action });
    this.props.onChange(userId, action);
  }

  render() {
    const { active, admin } = this.props;
    return (
      <select
        className="UserActionSelector"
        onChange={this.onChange}
        value={this.state.action}
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
}

UserActionSelector.propTypes = {
  active: PropTypes.bool.isRequired,
  admin: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
};

function User({ active, admin, email, onChange, userId, username }) {
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
          active={active}
          admin={admin}
          onChange={onChange}
          userId={userId}
        />
      </td>
    </tr>
  );
}

User.propTypes = {
  active: PropTypes.bool.isRequired,
  admin: PropTypes.bool.isRequired,
  email: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
};

User.defaultProps = {
  admin: false,
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
            active={id === activeUserId}
            admin={admin}
            email={email}
            key={id}
            onChange={onChange}
            userId={id}
            username={username}
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
      isInviteModalVisible: false,
      users: [],
    };
    this.getActionButtons = this.getActionButtons.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.onInviteUser = this.onInviteUser.bind(this);
    this.onUserActionChange = this.onUserActionChange.bind(this);
  }

  componentDidMount() {
    if (this.props.profile.admin) {
      this.getUsers();
    }
  }

  onInviteUser(email) {
    this.setState({ isInviteModalVisible: false });
    api.post('/api/admin/invites', { email });
  }

  onUserActionChange(userId, action) {
    const url = `/api/admin/users/${userId}`;
    if (action === 'delete') {
      api.delete(url).then(() => this.getUsers());
    } else if (action === 'demote') {
      api.patch(url, { admin: false }).then(() => this.getUsers());
    } else if (action === 'promote') {
      api.patch(url, { admin: true }).then(() => this.getUsers());
    }
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

  getUsers() {
    api.get('/api/admin/users')
      .then(users => this.setState({ users }));
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
            onChange={this.onUserActionChange}
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
