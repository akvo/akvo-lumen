import React, { PropTypes } from 'react';
/*
class AdminNav extends Component {
  render() {
    return (
      <h1>Admin</h1>
    );
  }
}
*/

export const AdminNav = () => (
  <h1>Admin</h1>
);

AdminNav.propTypes = {
  profile: PropTypes.object.isRequired,
  location: PropTypes.object,
};

export { AdminNav as default };
