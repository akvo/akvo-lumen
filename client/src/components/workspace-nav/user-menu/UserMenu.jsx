import React from 'react';
import PropTypes from 'prop-types';
import * as auth from '../../../utilities/auth';

class UserMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: false };
    this.expand = this.expand.bind(this);
    this.collapse = this.collapse.bind(this);
  }

  expand() {
    this.setState({
      expanded: true,
    });
  }

  collapse() {
    this.setState({
      expanded: false,
    });
  }

  render() {
    const profile = this.props.profile;
    const isExpanded = this.state.expanded;
    //
    return (
      <div className="UserMenu">
        {isExpanded ? (
          <div className="name">
            <i className="fa fa-user-o" aria-hidden="true" /> {profile.username}
            <a onClick={() => this.collapse()}>
              <i className="fa fa-caret-up" />
            </a>
            <hr />
            <a onClick={() => auth.logout()}>Logout</a>
          </div>
        ) : (
          <div className="name">
            <i className="fa fa-user-o" aria-hidden="true" /> {profile.username}
            <a onClick={() => this.expand()}>
              <i className="fa fa-caret-down" />
            </a>
          </div>
        )}
      </div>
    );
  }
}


UserMenu.propTypes = {
  profile: PropTypes.shape({
    username: PropTypes.string,
  }).isRequired,
};

export default UserMenu;
