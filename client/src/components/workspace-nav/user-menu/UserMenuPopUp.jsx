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
    const { close, buttonRef } = this.props;
    if (this.node.contains(e.target)) {
      return;
    }
    if (buttonRef.current.contains(e.target)) {
      return;
    }
    close();
  };

  render() {
    return (
      <div className="UserMenuPopUp" ref={(node) => { this.node = node; }}>
        <LocaleSelector />
        <hr />
        <button type="button" onClick={() => auth.logout()}>Logout</button>
      </div>
    );
  }
}

UserMenuPopUp.propTypes = {
  buttonRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  close: PropTypes.func.isRequired,
};

export default UserMenuPopUp;
