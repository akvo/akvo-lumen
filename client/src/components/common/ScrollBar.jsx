import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './ScrollBar.scss';

class ScrollBar extends Component {
  constructor(props) {
    super(props);
    this.handleScroll = this.handleScroll.bind(this);
    this.setProportions = this.setProportions.bind(this);
  }

  state = {
    innerWidth: 1,
    innerHeight: 1,
    outerWidth: 1,
    buttonWidth: 1,
    buttonLeft: 0,
    trackLeft: 0,
  }

  componentDidMount() {
    const WITH_HEIGHT = true;
    setTimeout(() => this.setProportions(WITH_HEIGHT), 100);
    this.interval = setInterval(this.setProportions, 2000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  setProportions(withHeight) {
    const outerWidth = this.wrapperElement.parentElement.offsetWidth;
    const innerWidth = this.contentElement.scrollWidth;
    const innerHeight = withHeight ? this.contentElement.scrollHeight : this.state.innerHeight;
    const outerToInner = outerWidth / innerWidth;
    const buttonWidth = (outerToInner * outerWidth);
    this.setState({
      innerWidth,
      innerHeight,
      outerWidth,
      outerToInner,
      buttonWidth,
    });
  }

  getElement() {
    return this.contentElement;
  }

  scrollTo(offsetLeft) {
    const { buttonWidth, outerToInner, innerWidth, outerWidth } = this.state;
    const newTrackLeft = Math.max(
      Math.min(
        offsetLeft,
        innerWidth
      ),
      0
    );
    const newButtonLeft = newTrackLeft * outerToInner;
    this.setState({
      trackLeft: newTrackLeft,
      buttonLeft: Math.min(newButtonLeft, outerWidth - buttonWidth),
    });
  }

  handleScroll({ deltaX }) {
    const { trackLeft } = this.state;
    const destination = deltaX ? trackLeft + deltaX : this.contentElement.scrollLeft;
    this.scrollTo(destination);
  }

  render() {
    const { buttonWidth, outerWidth, buttonLeft, innerHeight } = this.state;
    return (
      <div
        className="ScrollBar"
        ref={(c) => { this.wrapperElement = c; }}
      >
        <div
          className="ScrollBar-content"
          onScroll={this.handleScroll}
          onWheel={this.handleScroll}
          style={{ height: innerHeight, width: outerWidth }}
        >
          <div
            ref={(c) => { this.contentElement = c; }}
            className="ScrollBar-content-inner"
            style={{ height: innerHeight + 10 }}
          >
            {this.props.children}
          </div>
        </div>
        <div
          className="ScrollBar-track"
          style={{ width: outerWidth }}
        >
          <div
            className="ScrollBar-handle"
            style={{
              width: buttonWidth,
              left: buttonLeft,
            }}
          />
        </div>
      </div>
    );
  }
}

ScrollBar.propTypes = {
  children: PropTypes.node,
};

export default ScrollBar;
