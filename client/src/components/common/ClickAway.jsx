import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class ClickAway extends Component {

  static propTypes = {
    onClickAway: PropTypes.func,
    children: PropTypes.node,
  }

  constructor(props) {
    super(props);
    this.handleClickBody = this.handleClickBody.bind(this);
  }

  componentDidMount() {
    document.body.addEventListener('click', this.handleClickBody);
  }

  componentWillUnmount() {
    document.body.removeEventListener('click', this.handleClickBody);
  }

  handleClickBody({ target }) {
    if (this.container.contains(target)) return;
    this.props.onClickAway();
  }

  render() {
    const { children, onClickAway, ...rest } = this.props; // eslint-disable-line no-unused-vars
    return (
      <div
        {...rest}
        ref={(c) => {
          this.container = c;
        }}
      >
        {children}
      </div>
    );
  }
}
