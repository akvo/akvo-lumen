import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import LocaleSelector from './LocaleSelector';
import * as auth from '../../../utilities/auth';
import { showModal } from '../../../actions/activeModal';

require('./UserMenuPopUp.scss');

class UserMenuPopUp extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleShowEditUserModal = this.handleShowEditUserModal.bind(this);
  }

  componentWillMount() {
    document.addEventListener('mousedown', this.handleClick, false);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick, false);
  }

  handleClick = (e) => {
    const { close, buttonRef } = this.props;
    if (this.node.contains(e.target) || buttonRef.current.contains(e.target)) {
      return;
    }
    close();
  };

  handleShowEditUserModal() {
    const { close, dispatch } = this.props;
    close();
    dispatch(showModal('edit-user'));
  }

  render() {
    return (
      <div className="UserMenuPopUp" ref={(node) => { this.node = node; }}>
        <button type="button" onClick={this.handleShowEditUserModal}>Edit profile</button>
        <hr />
        <LocaleSelector />
        <hr />
        <button type="button" onClick={() => auth.logout()}>Logout</button>
      </div>
    );
  }
}

UserMenuPopUp.propTypes = {
  buttonRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
  close: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default connect(state => state)(UserMenuPopUp);
