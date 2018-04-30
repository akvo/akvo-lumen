import React, { PropTypes } from 'react';
import { withRouter } from 'react-router';

class NavigationPrompt extends React.Component {
  componentDidUpdate() {
    this.promptUnsavedChange();
  }

  componentWillUnmount() {
    window.onbeforeunload = null;
  }

  promptUnsavedChange() {
    const { message, shouldPrompt, router, route, routes } = this.props;
    router.setRouteLeaveHook(
      routes.length ? routes[routes.length - 1] : route,
      () => shouldPrompt && confirm(message)
    );
    window.onbeforeunload = shouldPrompt && (() => message);
  }

  render() {
    return this.props.children();
  }
}

NavigationPrompt.propTypes = {
  shouldPrompt: PropTypes.bool,
  message: PropTypes.string.isRequired,
  router: PropTypes.object,
  route: PropTypes.object,
  routes: PropTypes.array,
  children: PropTypes.func.isRequired,
};

NavigationPrompt.defaultProps = {
  message: 'You have unsaved changes, are you sure you want to leave this page?',
};

export default withRouter(NavigationPrompt);
