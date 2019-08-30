import React from 'react';
import PropTypes from 'prop-types';
import LocaleSelector from './LocaleSelector';
import * as auth from '../../../utilities/auth';

require('./UserMenuPopUp.scss');

class UserMenuPopUp extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  componentWillMount() {
    document.addEventListener('mousedown', this.handleClick, false);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick, false);
  }

  handleClick = (e) => {
    const { close } = this.props;
    if (this.node.contains(e.target)) {
      return;
    }
    close();
  };

  render() {
    return (
      <div className="UserMenuPopUp" ref={(node) => { this.node = node; }}>
        <button type="button" onClick={() => console.log('@edit profile')}>Edit profile</button>
        <hr />
        <LocaleSelector />
        <hr />
        <button type="button" onClick={() => auth.logout()}>Logout</button>
      </div>
    );
  }
}

UserMenuPopUp.propTypes = {
  close: PropTypes.func.isRequired,
};

export default UserMenuPopUp;
