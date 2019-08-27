import React from 'react';
import PropTypes from 'prop-types';
import { Manager, Reference, Popper } from 'react-popper';
import UserMenuPopUp from './UserMenuPopUp';

require('./UserMenu.scss');

class UserMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isExpanded: false };
    this.toggle = this.toggle.bind(this);
    this.close = this.close.bind(this);
  }

  toggle() {
    this.setState(prevState => ({
      isExpanded: !prevState.isExpanded,
    }));
  }

  close() {
    this.setState({ isExpanded: false });
  }

  render() {
    const { profile } = this.props;
    const { isExpanded } = this.state;

    return (
      <div className="UserMenu">
        <Manager>
          <Reference>
            {({ ref }) => (
              <button type="button" ref={ref} onClick={() => this.toggle()}>
                <i className="fa fa-user-o userIcon" aria-hidden="true" />
                {profile.firstName || profile.email}
                <i className="fa fa-caret-down downArrow" />
              </button>
            )}
          </Reference>
          {isExpanded && (
            <Popper placement="bottom-start">
              {({ ref, style, placement, arrowProps }) => (
                <div ref={ref} style={style} data-placement={placement}>
                  <UserMenuPopUp close={this.close} />
                  <div ref={arrowProps.ref} style={arrowProps.style} />
                </div>
              )}
            </Popper>
          )}
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
