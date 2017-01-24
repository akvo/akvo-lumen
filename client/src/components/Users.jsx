import React, { Component, propTypes } from 'react';
import { connect } from 'react-redux';
import { fetchUsers } from '../actions/users';

function UserList() {
  return (
    <ul>
      <li>Jonas</li>
      <li>Daniel</li>
      <li>Gabe</li>
    </ul>
  );
}

class Users extends Component {

  constructor() {
    super();
    this.state = {
      userList: [],
    };
  }

  componentDidMount() {
    this.props.dispatch(fetchUsers());
  }

  render() {
    return (
      <div className="users">
        <h1>User List</h1>
        <UserList />
      </div>
    );
  }
}

Users.propTypes = {
  dispatch: propTypes.func,
  params: propTypes.object,
};
