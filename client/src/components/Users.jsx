import React, { Component, PropTypes } from 'react';
import * as api from '../api';

require('../styles/Users.scss');

function User({ email, name, admin }) {
  return (
    <tr>
      <td>{name}</td>
      <td>{email}</td>
      <td>{admin ? 'admin' : 'user'}</td>
    </tr>
  );
}

User.propTypes = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  admin: PropTypes.bool.isRequired,
};

function UserList({ users }) {
  return (
    <table>
      <tr><th>Name</th><th>Email</th><th>Role</th></tr>
      {users.map(({ email, admin, name }) => (
        <User email={email} admin={admin} name={name} />
      ))}
    </table>
  );
}

UserList.propTypes = {
  users: PropTypes.array.isRequired,
};

export default class Users extends Component {

  constructor() {
    super();
    this.state = {
      users: [],
    };
  }

  componentDidMount() {
    api.get('/api/users')
      .then(users => this.setState({ users }));
  }

  render() {
    return (
      <div className="Users">
        <h1>Members</h1>
        <UserList users={this.state.users} />
      </div>
    );
  }
}

Users.propTypes = {
  dispatch: PropTypes.func,
  params: PropTypes.object,
};
