import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
// import EntityTypeHeader from './entity-editor/EntityTypeHeader';
import UserInviteButton from './users/UserInviteButton';
import * as api from '../api';

// require('../styles/EntityTypeHeader.scss');
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
      users: [],
    };
  }

  componentDidMount() {
    if (this.props.profile.admin) {
      api.get('/api/admin/users')
        .then(users => this.setState({ users }));
    }
  }

  render() {
    const { admin } = this.props.profile;
    return (
      <div className="UsersContainer">
        <div className="UsersHeader">
          <div className="row rowPrimary">
            <UserInviteButton />
          </div>
        </div>
        <div className="Users">
          { admin ?
            <UserList users={this.state.users} />
            :
            <div>
              <p>You need to be an Admin users to view and invite users</p>
            </div>
          }
        </div>
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
