import React, { Component } from 'react';
import PropTypes from 'prop-types';
import vg from 'vega';
import isEqual from 'lodash/isEqual';
import * as chart from '../../utilities/chart';

require('./Chart.scss');

function getSize(computedWidth) {
  let size;

  if (computedWidth < 240) {
    size = 'xsmall';
  } else if (computedWidth < 480) {
    size = 'small';
  } else if (computedWidth < 720) {
    size = 'medium';
  } else if (computedWidth < 860) {
    size = 'large';
  } else {
    size = 'xlarge';
  }

  return size;
}

const getTitleStyle = (title = '', chartSize) => {
  const titleLength = title.toString().length;
  const padding = 8;

  let baseFontSize;

  switch (chartSize) {
    case 'xsmall':
      baseFontSize = 12;
      break;
    case 'small':
      baseFontSize = 14;
      break;
    case 'medium':
    case 'large':
      baseFontSize = 16;
      break;
    case 'xlarge':
      baseFontSize = 20;
      break;

    default:
      baseFontSize = 16;
  }

  if (titleLength > 96) {
    baseFontSize -= 2;
  }

  const lineHeight = Math.floor(baseFontSize * 1.4);

  return ({
    height: titleLength <= 48 ? lineHeight + (padding * 2) : (lineHeight * 2) + (padding * 2),
    fontSize: baseFontSize,
    lineHeight: `${lineHeight}px`,
  });
};

export default class Chart extends Component {

  constructor() {
    super();
    this.state = {
      chartHeight: null,
      titleHeight: null,
      titleLength: null,
    };
  }

  componentDidMount() {
    const { visualisation, width } = this.props;
    const titleHeight = getTitleStyle(visualisation.name, getSize(width)).height;
    const chartHeight = this.props.height - titleHeight;

    this.renderChart(this.props, chartHeight);
  }

  componentWillReceiveProps(nextProps) {
    const visualisationChanged = !isEqual(this.props.visualisation, nextProps.visualisation);
    const sizeChanged = this.props.width !== nextProps.width ||
      this.props.height !== nextProps.height;

    if (visualisationChanged || sizeChanged) {
      const { visualisation, width } = nextProps;
      const titleHeight = getTitleStyle(visualisation.name, getSize(width)).height;
      const chartHeight = nextProps.height - titleHeight;

      this.renderChart(nextProps, chartHeight);
    }
  }

  renderChart(props, height) {
    const { visualisation, datasets, width } = props;
    const containerHeight = height || 400;
    const containerWidth = width || 800;
    const chartSize = getSize(containerWidth);
    let chartData;
    switch (visualisation.visualisationType) {
      case 'pie':
      case 'donut':
        chartData = visualisation.data;
        if (!chartData) {
          // Aggregated data hasn't loaded yet - do nothing
          return;
        }
        break;
      case 'area':
      case 'line':
        chartData = chart.getLineData(visualisation, datasets);
        break;
      case 'scatter':
        chartData = chart.getScatterData(visualisation, datasets);
        break;
      case 'bar':
        chartData = chart.getBarData(visualisation, datasets);
        break;
      default:
        throw new Error(`Unknown visualisation type ${visualisation.visualisationType}`);
    }
    /* TODO - once we support backend aggregations for more vTypes, it doesn't make sense to
    ** pass `chartData` separately, because we include it on the visualisation itself */
    const vegaSpec =
      chart.getVegaSpec(visualisation, chartData, containerHeight, containerWidth, chartSize);

    vg.parse.spec(vegaSpec, (error, vegaChart) => {
      this.vegaChart = vegaChart({ el: this.element });
      this.vegaChart.update();
    });
  }

  render() {
    const { visualisation, width, height } = this.props;
    const { visualisationType } = visualisation;
    const containerHeight = height || 400;
    const containerWidth = width || 800;
    const chartSize = getSize(containerWidth);
    const className = `Chart ${visualisationType} ${chartSize}`;

    return (
      <div
        className={className}
        style={{
          width: containerWidth,
          height: containerHeight,
        }}
      >
        <h2
          style={getTitleStyle(visualisation.name, chartSize)}
        >
          <span>
            {visualisation.name}
          </span>
        </h2>
        <div
          ref={(el) => { this.element = el; }}
        />
      </div>
    );
  }
}

Chart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};
