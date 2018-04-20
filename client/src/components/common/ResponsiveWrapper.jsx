import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Measure from 'react-measure';
import debounce from 'lodash/debounce';

export default class ResponsiveWrapper extends Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.handleResize = debounce(this.handleResize.bind(this), 500, { maxWait: 1000 });
  }

  state = {
    dimensions: {
      width: -1,
      height: -1,
    },
  }

  handleResize(contentRect) {
    this.setState({ dimensions: contentRect.bounds });
  }

  render() {
    const { width, height } = this.state.dimensions;
    const shouldRender = width > 0 && height > 0;

    return (
      <Measure
        bounds
        onResize={this.handleResize}
      >
        {({ measureRef }) => (
          <div ref={measureRef} style={{ width: '100%', height: '100%' }}>
            {shouldRender && this.props.children({ width, height })}
          </div>
        )}
      </Measure>
    );
  }
}
