import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';

class NavigationPrompt extends React.Component {
  componentDidUpdate() {
    this.promptUnsavedChange();
  }

  componentWillUnmount() {
    window.onbeforeunload = null;
  }

  promptUnsavedChange() {
    const { message, shouldPrompt, history } = this.props;
    if (shouldPrompt) {
      const unblock = history.block(message);
      window.onbeforeunload = () => unblock();
    }
  }

  render() {
    return this.props.children;
  }
}

NavigationPrompt.propTypes = {
  shouldPrompt: PropTypes.bool,
  message: PropTypes.string.isRequired,
  history: PropTypes.object.isRequired,
  route: PropTypes.object,
  routes: PropTypes.array,
  children: PropTypes.node.isRequired,
};

NavigationPrompt.defaultProps = {
  message: 'You have unsaved changes, are you sure you want to leave this page?',
};

export default withRouter(NavigationPrompt);
