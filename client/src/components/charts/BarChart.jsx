import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import SimpleBarChart from './SimpleBarChart';
import StackedBarChart from './StackedBarChart';

export default class BarChart extends Component {

  static propTypes = {
    data: PropTypes.shape({
      data: PropTypes.oneOfType([
        PropTypes.arrayOf(
          PropTypes.shape({
            key: PropTypes.string,
            value: PropTypes.number,
          })
        ),
        PropTypes.arrayOf(
          PropTypes.shape({
            key: PropTypes.string,
            values: PropTypes.arrayOf(
              PropTypes.number
            ),
          })
        ),
      ]),
      metadata: PropTypes.object,
    }),
    grouped: PropTypes.bool,
  }

  static defaultProps = {
    edit: false,
  }

  render() {
    const { data } = this.props;
    const series = get(data, 'series');
    if (!series) return null;
    if (series.length === 1) {
      return (
        <SimpleBarChart {...this.props} />
      );
    }
    return (
      <StackedBarChart {...this.props} />
    );
  }

}
