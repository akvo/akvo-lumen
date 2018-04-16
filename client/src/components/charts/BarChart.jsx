import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import SimpleBarChart from './SimpleBarChart';
import GroupedBarChart from './GroupedBarChart';
import StackedBarChart from './StackedBarChart';

export default class PieChart extends Component {

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
    const { data, grouped } = this.props;

    if (!get(data, 'series')) return null;
    if (typeof get(this.props.data, 'data[0].values') === 'undefined') {
      return (
        <SimpleBarChart {...this.props} />
      );
    }
    return grouped ? (
      <GroupedBarChart {...this.props} />
    ) : (
      <StackedBarChart {...this.props} />
    );
  }

}
