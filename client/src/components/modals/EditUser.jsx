import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { updateUser } from '../../actions/user';
import ModalFooter from './ModalFooter';


class EditUser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      firstName: this.props.profile.firstName,
      lastName: this.props.profile.lastName,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFirstNameChange = this.handleFirstNameChange.bind(this);
    this.handleLastNameChange = this.handleLastNameChange.bind(this);
  }

  handleFirstNameChange(event) {
    this.setState({ firstName: event.target.value });
  }

  handleLastNameChange(event) {
    this.setState({ lastName: event.target.value });
  }

  handleSubmit() {
    const user = {
      ...this.state,
      id: this.props.profile.keycloakId,
    };
    this.props.onSubmit(updateUser(user));
  }

  render() {
    const { onCancel } = this.props;
    const { firstName, lastName } = this.state;
    return (
      <div className="EditUser">
        <h2>User</h2>
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="firstNameInput">Given name
            <input
              id="firstNameInput"
              value={firstName}
              onChange={this.handleFirstNameChange}
              type="text"
              placeholder="Given name"
              autoFocus
              maxLength={127}
            />
          </label>
          <br /><br />
          <label htmlFor="lastNameInput">Family name
            <input
              id="lastNameInput"
              value={lastName}
              onChange={this.handleLastNameChange}
              type="text"
              placeholder="Family name"
              maxLength={127}
            />
          </label>
        </form>
        <br /><br />
        <ModalFooter
          leftButton={{
            text: 'Cancel',
            className: 'cancel',
            onClick: onCancel,
          }}
          rightButton={{
            className: 'save',
            onClick: this.handleSubmit,
            text: 'Save',
          }}
        />
      </div>
    );
  }
}

EditUser.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  profile: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    keycloakId: PropTypes.string,
  }).isRequired,
};

function mapStateToProps(state) {
  return {
    profile: state.profile,
  };
}

export default connect(mapStateToProps)(injectIntl(EditUser));
