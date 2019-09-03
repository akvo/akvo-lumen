import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { updateUser } from '../../actions/user';
import ModalFooter from './ModalFooter';

require('./EditUser.scss');

class EditUser extends Component {
  constructor(props) {
    super(props);
    const { profile } = this.props;
    this.state = {
      firstName: profile.firstName,
      lastName: profile.lastName,
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
    const { onSubmit, profile } = this.props;
    const user = {
      ...this.state,
      id: profile.keycloakId,
    };
    onSubmit(updateUser(user));
  }

  render() {
    const { onCancel } = this.props;
    const { firstName, lastName } = this.state;
    return (
      <div className="EditUser">
        <h2>User</h2>
        <div className="EditUserForms">
          <div>
            <label htmlFor="firstNameInput">
              <FormattedMessage id="first_name" />:
            </label>
            <input
              id="firstNameInput"
              className="firstNameInput"
              value={firstName}
              onChange={this.handleFirstNameChange}
              type="text"
              maxLength={127}
            />
          </div>
          <div>
            <label htmlFor="lastNameInput">
              <FormattedMessage id="last_name" />:
            </label>
            <input
              id="lastNameInput"
              value={lastName}
              onChange={this.handleLastNameChange}
              type="text"
              maxLength={127}
            />
          </div>
        </div>
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
