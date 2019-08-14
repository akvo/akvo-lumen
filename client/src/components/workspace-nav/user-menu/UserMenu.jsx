import React from 'react';
import PropTypes from 'prop-types';
import { Manager, Reference, Popper } from 'react-popper';
import UserMenuPopUp from './UserMenuPopUp';

class UserMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isExpanded: false };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState(prevState => ({
      isExpanded: !prevState.isExpanded,
    }));
  }

  render() {
    const profile = this.props.profile;
    const isExpanded = this.state.isExpanded;

    return (
      <div className="UserMenu">
        <i className="fa fa-user-o" aria-hidden="true" /> {profile.username}
        <Manager>
          <Reference>
            {({ ref }) => (
              <a ref={ref} onClick={() => this.toggle()}>&nbsp;<i className="fa fa-caret-down" /></a>
            )}
          </Reference>
          {isExpanded &&
            <Popper placement="bottom-start">
              {({ ref, style, placement, arrowProps }) => (
                <div ref={ref} style={style} data-placement={placement}>
                  <UserMenuPopUp />
                  <div ref={arrowProps.ref} style={arrowProps.style} />
                </div>
              )}
            </Popper>
          }
        </Manager>
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
