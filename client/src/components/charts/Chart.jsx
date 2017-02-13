import React, { Component, PropTypes } from 'react';
import vg from 'vega';
import isEqual from 'lodash/isEqual';
import * as chart from '../../utilities/chart';

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

export default class Chart extends Component {

  componentDidMount() {
    this.renderChart(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const visualisationChanged = !isEqual(this.props.visualisation, nextProps.visualisation);
    const sizeChanged = this.props.width !== nextProps.width ||
      this.props.height !== nextProps.height;

    if (visualisationChanged || sizeChanged) {
      this.renderChart(nextProps);
    }
  }

  renderChart(props) {
    const { visualisation, datasets, width, height } = props;
    const containerHeight = height || 400;
    const containerWidth = width || 800;
    let chartData;
    switch (visualisation.visualisationType) {
      case 'pie':
      case 'donut':
        chartData = chart.getPieData(visualisation, datasets);
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
    const vegaSpec = chart.getVegaSpec(visualisation, chartData, containerHeight, containerWidth);

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
