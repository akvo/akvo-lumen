import React, { Component } from 'react';

class EditUser extends Component {
  constructor() {
    super();
    this.state = {
      editPending: false,
    };
  }
  render() {
    return (
      <div className="EditUser">
        <h2>EditUser</h2>
      </div>
    );
  }
}

EditUser.propTypes = {};

export default EditUser;
