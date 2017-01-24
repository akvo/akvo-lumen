import React, { Component, propTypes } from 'react';
import { connect } from 'react-redux';
import { fetchUsers } from '../actions/users';

function UserList(props) {
  return (
    <div className="userList">
      <h1>List of users</h1>
      <ul>
        <li>Jonas</li>
        <li>Daniel</li>
        <li>Gabe</li>
      </ul>
    </div>
  );
}

class UserListContainer extends Component {

  constructor() {
    super();
    this.state = {
      userList: [],
    };
  }

  componentDidMount() {
  }
}

UserListContainer.propTypes = {
  dispatch: propTypes.func,
  params: propTypes.object,
};
