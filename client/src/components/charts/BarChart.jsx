import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import SimpleBarChart from './bar/SimpleBarChart';
import StackedBarChart from './bar/StackedBarChart';
import SimpleBarChartHorizontal from './bar/SimpleBarChartHorizontal';
import StackedBarChartHorizontal from './bar/StackedBarChartHorizontal';

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
    horizontal: PropTypes.bool,
    env: PropTypes.object.isRequired,
  }

  static defaultProps = {
    edit: false,
  }

  render() {
    const { data, horizontal } = this.props;
    const series = get(data, 'series');
    if (!series) return null;
    if (series.length === 1) {
      return horizontal ? (
        <SimpleBarChartHorizontal {...this.props} />
      ) : (
        <SimpleBarChart {...this.props} />
      );
    }
    return horizontal ? (
      <StackedBarChartHorizontal {...this.props} />
    ) : (
      <StackedBarChart {...this.props} />
    );
  }

}
