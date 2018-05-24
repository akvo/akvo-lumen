import React, { Component } from 'react';
import PropTypes from 'prop-types';
import vg from 'vega';
import moment from 'moment';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import { FormattedMessage } from 'react-intl';
import * as chart from '../../utilities/chart';
import LineChart from './LineChart';
import BarChart from './BarChart';
import { defaultPrimaryColor, palette } from '../../utilities/visualisationColors';
import PieChart from './PieChart';
import { defaultPrimaryColor, palette } from '../../utilities/visualisationColors';

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

  let fontSize;

  switch (chartSize) {
    case 'xsmall':
      fontSize = 12;
      break;
    case 'small':
      fontSize = 14;
      break;
    case 'medium':
    case 'large':
      fontSize = 16;
      break;
    case 'xlarge':
      fontSize = 20;
      break;

    default:
      fontSize = 16;
  }

  if (titleLength > 96) {
    fontSize -= 2;
  }

  const lineHeight = Math.floor(fontSize * 1.4);

  return ({
    height: titleLength <= 48 ? lineHeight + (padding * 2) : (lineHeight * 2) + (padding * 2),
    fontSize,
    lineHeight: `${lineHeight}px`,
  });
};

const META_SCALE = 0.5;

export default class Chart extends Component {

  static propTypes = {
    visualisation: PropTypes.object.isRequired,
    datasets: PropTypes.object.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    onChangeVisualisationSpec: PropTypes.func,
  }

  constructor() {
    super();
    this.state = {
      chartHeight: null,
      titleHeight: null,
      titleLength: null,
    };

    this.renderNewChart = this.renderNewChart.bind(this);
  }

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

  getDataset(nextProps) {
    const { datasets, visualisation } = nextProps || this.props;
    return datasets[visualisation.datasetId];
  }

  renderChart(props) {
    const { visualisation, width, height } = props;

    /* Hard coding an exit for new chart types seems fine temporarily...*/
    if (
      visualisation.visualisationType === 'line' ||
      visualisation.visualisationType === 'area' ||
      visualisation.visualisationType === 'bar' ||
      visualisation.visualisationType === 'donut' ||
      visualisation.visualisationType === 'pie'
    ) {
      return;
    }

    const dataset = this.getDataset(props);
    const titleHeight = getTitleStyle(visualisation.name, getSize(width)).height * (1 + META_SCALE);
    const containerHeight = (height - titleHeight) || 400;
    const containerWidth = width || 800;
    const chartSize = getSize(containerWidth);
    let chartData;
    switch (visualisation.visualisationType) {
      case 'pie':
      case 'donut':
      case 'area':
      case 'line':
      case 'bar':
        chartData = visualisation.data;
        if (!chartData) {
          // Aggregated data hasn't loaded yet - do nothing
          return;
        }
        break;
      case 'scatter':
        chartData = chart.getScatterData(visualisation, dataset);
        break;
      // no default
    }

    if (!chartData) return;

    /* TODO - once we support backend aggregations for more vTypes, it doesn't make sense to
    ** pass `chartData` separately, because we include it on the visualisation itself */
    const vegaSpec =
      chart.getVegaSpec(visualisation, chartData, containerHeight, containerWidth, chartSize);

    vg.parse.spec(vegaSpec, (error, vegaChart) => {
      this.vegaChart = vegaChart({ el: this.element });
      this.vegaChart.update();
    });
  }

  renderNewChart() {
    const {
      visualisation,
      width,
      height,
      onChangeVisualisationSpec,
    } = this.props;

    const titleHeight = getTitleStyle(visualisation.name, getSize(width)).height * (1 + META_SCALE);
    const adjustedContainerHeight = ((height - titleHeight) - (titleHeight * META_SCALE)) || 400;

    switch (visualisation.visualisationType) {
      case 'pie':
      case 'donut':
        return (
          <PieChart
            visualisation={visualisation}
            data={visualisation.data}
            width={width}
            height={adjustedContainerHeight}
            colors={palette}
            colorMapping={visualisation.spec.colors}
            donut={Boolean(visualisation.visualisationType === 'donut')}
            legendVisible={Boolean(visualisation.spec.showLegend)}
            onChangeVisualisationSpec={onChangeVisualisationSpec}
            edit={Boolean(onChangeVisualisationSpec)}
          />
        );
      case 'line':
      case 'area':
        return (
          <LineChart
            visualisation={visualisation}
            data={visualisation.data}
            width={width}
            height={adjustedContainerHeight}
            color={defaultPrimaryColor}
            xAxisLabel={visualisation.spec.axisLabelX}
            yAxisLabel={visualisation.spec.axisLabelY}
            area={Boolean(visualisation.visualisationType === 'area')}
            onChangeVisualisationSpec={onChangeVisualisationSpec}
            edit={Boolean(onChangeVisualisationSpec)}
          />
        );
      case 'bar':
        return (
          <BarChart
            edit
            visualisation={visualisation}
            data={visualisation.data}
            width={width}
            height={adjustedContainerHeight}
            colors={palette}
            colorMapping={visualisation.spec.colors}
            xAxisLabel={visualisation.spec.axisLabelX}
            yAxisLabel={visualisation.spec.axisLabelY}
            area={Boolean(visualisation.visualisationType === 'area')}
            grouped={Boolean(visualisation.spec.subBucketMethod === 'split')}
            onChangeVisualisationSpec={onChangeVisualisationSpec}
          />
        );
      default:
        console.warn(`Unknown visualisation type ${visualisation.visualisationType}`);
      /*
      case 'pie':
      case 'donut': {
        return (
          <PieChart
            colors={colors}
            data={visualisation.data}
            width={width}
            height={height}
            onChangeVisualisationSpec={onChangeVisualisationSpec}
          />
        );
      }
      */
    }
    return null;
  }

  render() {
    const { visualisation, width, height } = this.props;
    const { visualisationType } = visualisation;
    const containerHeight = height || 400;
    const containerWidth = width || 800;
    const chartSize = getSize(containerWidth);
    const className = `Chart ${visualisationType} ${chartSize}`;
    const dataset = this.getDataset();
    const titleStyle = getTitleStyle(visualisation.name, chartSize);
    const metaStyle = {
      height: titleStyle.height * META_SCALE,
      fontSize: titleStyle.fontSize * META_SCALE,
      lineHeight: `${parseFloat(titleStyle.lineHeight) * META_SCALE}px`,
    };

    return (
      <div
        className={className}
        style={{
          width: containerWidth,
          height: containerHeight,
        }}
      >
        <h2 style={titleStyle}>
          <span>
            {visualisation.name}
          </span>
        </h2>
        <p className="chartMeta" style={metaStyle}>
          <span className="capitalize">
            <FormattedMessage id="data_last_updated" />
          </span>: {moment(dataset.get('updated')).format('Do MMM YYYY - HH:mm')}
          {
            // TODO: translate
            get(visualisation, 'data.common.metadata.sampled') ?
              <span> (Using Sampled Data)</span>
              :
              null
          }
        </p>
        <div
          ref={(el) => { this.element = el; }}
        />
        {this.renderNewChart()}
      </div>
    );
  }
}
