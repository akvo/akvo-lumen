import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import EntityTypeHeader from './entity-editor/EntityTypeHeader';
import InviteUser from './modals/InviteUser';
import * as api from '../api';

require('../styles/EntityTypeHeader.scss');
require('../styles/Users.scss');

function User({ email, username, admin }) {
  return (
    <tr>
      <td>{username}</td>
      <td>{email}</td>
      <td>{admin ? 'Admin' : 'User'}</td>
    </tr>
  );
}

User.propTypes = {
  username: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  admin: PropTypes.bool,
};

User.defaultProps = {
  admin: false,
};

function UserList({ users }) {
  return (
    <table>
      <tbody>
        <tr><th>Name</th><th>Email</th><th>Role</th></tr>
        {users.map(({ email, admin, username }) => (
          <User key={username} email={email} admin={admin} username={username} />
        ))}
      </tbody>
    </table>
  );
}

UserList.propTypes = {
  users: PropTypes.array.isRequired,
};

class Users extends Component {

  constructor() {
    super();
    this.state = {
      invitedUserEmail: '',
      isInviteModalVisible: false,
      users: [],
    };
    this.getActionButtons = this.getActionButtons.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onInviteUser = this.onInviteUser.bind(this);
  }

  componentDidMount() {
    if (this.props.profile.admin) {
      api.get('/api/admin/users')
        .then(users => this.setState({ users }));
    }
  }

  onChange(event) {
    this.setState({ invitedUserEmail: event.target.value });
  }

  onInviteUser() {
    api.post('/api/admin/invites', { email: this.state.invitedUserEmail.trim().toLowerCase() });
  }

  getActionButtons() {
    const invite = {
      buttonText: 'Invite user',
      onClick: () => this.setState({ isInviteModalVisible: true }),
    };

    return [invite];
  }

  render() {
    const actionButtons = this.getActionButtons();
    const { admin } = this.props.profile;
    const saveStatus = '';
    const title = 'Members';

    if (!admin) {
      return (
        <div>
          <p>You need to be an Admin user to view and invite other users</p>
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
          <UserList users={this.state.users} />
        </div>
        <InviteUser
          invitedUserEmail={this.state.invitedUserEmail}
          isOpen={this.state.isInviteModalVisible}
          onChange={this.onChange}
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
  }).isRequired,
};
