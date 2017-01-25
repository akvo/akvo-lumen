import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
// import UserInviteButton from './users/UserInviteButton';
import * as api from '../api';

require('../styles/Users.scss');

function User({ email, username, admin }) {
  return (
    <tr>
      <td>{username}</td>
      <td>{email}</td>
      <td>{admin ? 'admin' : 'user'}</td>
    </tr>
  );
}

User.propTypes = {
  username: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  admin: PropTypes.bool,
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
      users: [],
    };
  }

  componentDidMount() {
    if (this.props.profile.admin) {
      api.get('/api/users')
        .then(users => this.setState({ users }));
    }
  }

  render() {
    const { admin } = this.props.profile;
    return (
      <div className="Users">
        <h1>Members</h1>
        { admin ?
          <UserList users={this.state.users} />
          :
          <div>You need to be admin to view and invite users</div>
        }
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
