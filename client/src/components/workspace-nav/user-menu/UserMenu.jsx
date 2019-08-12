import React from 'react';
import PropTypes from 'prop-types';
import { Manager, Reference, Popper } from 'react-popper';
import * as auth from '../../../utilities/auth';

const Example = () => (
  <Manager>
    <Reference>
      {({ ref }) => (
        <button type="button" ref={ref}>
          Reference element
        </button>
      )}
    </Reference>
    <Popper placement="right">
      {({ ref, style, placement, arrowProps }) => (
        <div ref={ref} style={style} data-placement={placement}>
          Popper element
          <div ref={arrowProps.ref} style={arrowProps.style} />
        </div>
      )}
    </Popper>
  </Manager>
);

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

    return (
      <div className="UserMenu">
        <Example />
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


/*
 
  {isExpanded ? (
          <div className="name">
            <i className="fa fa-user-o" aria-hidden="true" /> {profile.username}
            <a onClick={() => this.collapse()}>&nbsp;<i className="fa fa-caret-up" /></a>
            <h4>Language</h4>
            English Espanol Francais
            <div>
              <a onClick={() => auth.logout()}>Logout</a>
            </div>
          </div>
        ) : (
          <div className="name">
            <i className="fa fa-user-o" aria-hidden="true" /> {profile.username}
            <a onClick={() => this.expand()}>&nbsp;<i className="fa fa-caret-down" /></a>
          </div>
        )} 
 */