import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { FormattedMessage } from 'react-intl';

import AggregationError from './AggregationError';
import LineChart from './LineChart';
import BarChart from './BarChart';
import BubbleChart from './BubbleChart';
import PieChart from './PieChart';
import PolarAreaChart from './PolarAreaChart';
import ScatterChart from './ScatterChart';
import { defaultPrimaryColor, palette } from '../../utilities/visualisationColors';
import { getTitle, getDataLastUpdated } from '../../utilities/chart';

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
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onChangeVisualisationSpec: PropTypes.func,
    showTitle: PropTypes.bool,
    env: PropTypes.object.isRequired,
  }

  static defaultProps = {
    showTitle: true,
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

  getDataset(nextProps) {
    const { datasets, visualisation } = nextProps || this.props;
    return datasets[visualisation.datasetId];
  }

  renderNewChart() {
    const {
      visualisation,
      width,
      height,
      onChangeVisualisationSpec,
      showTitle,
      env,
    } = this.props;

    if (!visualisation.data) {
      return null;
    }

    if (visualisation.data.error) {
      return (
        <AggregationError
          reason={visualisation.data.reason}
          count={visualisation.data.count}
          max={visualisation.data.max}
        />
      );
    } else if (get(visualisation, 'data.message', '').indexOf('Invalid filter') > -1) {
      return (
        <AggregationError
          reason="invalid-filter"
        />
      );
    }

    const titleHeight = showTitle ?
      getTitleStyle(visualisation.name, getSize(width)).height * (1 + META_SCALE)
      : 0;
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
            legendVisible={visualisation.spec.showLegend}
            legendPosition={visualisation.spec.legendPosition}
            labelsVisible={visualisation.spec.showLabels}
            legendTitle={visualisation.spec.legendTitle}
            onChangeVisualisationSpec={onChangeVisualisationSpec}
            edit={Boolean(onChangeVisualisationSpec)}
            env={env}
          />
        );
      case 'polararea':
        return (
          <PolarAreaChart
            visualisation={visualisation}
            data={visualisation.data}
            width={width}
            height={adjustedContainerHeight}
            colors={palette}
            colorMapping={visualisation.spec.colors}
            donut={Boolean(visualisation.visualisationType === 'donut')}
            legendVisible={visualisation.spec.showLegend}
            legendPosition={visualisation.spec.legendPosition}
            labelsVisible={visualisation.spec.showLabels}
            legendTitle={visualisation.spec.legendTitle}
            onChangeVisualisationSpec={onChangeVisualisationSpec}
            edit={Boolean(onChangeVisualisationSpec)}
            env={env}
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
            color={visualisation.spec.color || defaultPrimaryColor}
            xAxisLabel={visualisation.spec.axisLabelX}
            yAxisLabel={visualisation.spec.axisLabelY}
            area={Boolean(visualisation.visualisationType === 'area')}
            onChangeVisualisationSpec={onChangeVisualisationSpec}
            edit={Boolean(onChangeVisualisationSpec)}
            legendPosition={visualisation.spec.legendPosition}
          />
        );
      case 'scatter':
        return (
          <ScatterChart
            visualisation={visualisation}
            data={visualisation.data}
            width={width}
            height={adjustedContainerHeight}
            color={visualisation.spec.color || defaultPrimaryColor}
            colors={palette}
            colorMapping={visualisation.spec.colorMapping}
            xAxisLabel={visualisation.spec.axisLabelX}
            yAxisLabel={visualisation.spec.axisLabelY}
            sizeLabel={visualisation.spec.sizeLabel}
            categoryLabel={visualisation.spec.categoryLabel}
            onChangeVisualisationSpec={onChangeVisualisationSpec}
            edit={Boolean(onChangeVisualisationSpec)}
            legendVisible={visualisation.spec.showLegend}
            legendTitle={visualisation.spec.categoryLabel}
            legendDescription={visualisation.spec.sizeLabel}
            legendPosition={visualisation.spec.legendPosition}
          />
        );
      case 'bar':
        return (
          <BarChart
            edit={Boolean(onChangeVisualisationSpec)}
            visualisation={visualisation}
            data={visualisation.data}
            width={width}
            height={adjustedContainerHeight}
            colors={palette}
            colorMapping={visualisation.spec.colors}
            defaultColor={defaultPrimaryColor}
            xAxisLabel={visualisation.spec.axisLabelX}
            yAxisLabel={visualisation.spec.axisLabelY}
            area={Boolean(visualisation.visualisationType === 'area')}
            subBucketMethod={visualisation.spec.subBucketMethod}
            onChangeVisualisationSpec={onChangeVisualisationSpec}
            legendTitle={visualisation.spec.legendTitle}
            legendVisible={visualisation.spec.showLegend}
            legendPosition={visualisation.spec.legendPosition}
            valueLabelsVisible={visualisation.spec.showValueLabels}
            horizontal={visualisation.spec.horizontal}
          />
        );
      case 'bubble':
        return (
          <BubbleChart
            edit={Boolean(onChangeVisualisationSpec)}
            visualisation={visualisation}
            data={visualisation.data}
            width={width}
            height={adjustedContainerHeight}
            colors={palette}
            colorMapping={visualisation.spec.colors}
            onChangeVisualisationSpec={onChangeVisualisationSpec}
            legendTitle={visualisation.spec.legendTitle}
            legendDescription={visualisation.spec.metricLabel}
            legendVisible={visualisation.spec.showLegend}
            legendPosition={visualisation.spec.legendPosition}
            labelsVisible={visualisation.spec.showLabels}
          />
        );
      default:
        console.warn(`Unknown visualisation type ${visualisation.visualisationType}`); // eslint-disable-line
    }
    return null;
  }

  renderLastUpdated() {
    const { visualisation, datasets } = this.props;
    const lastUpdated = getDataLastUpdated({ datasets, visualisation });
    return lastUpdated ? (
      <span>
        <span className="capitalize">
          <FormattedMessage id="data_last_updated" />: {lastUpdated}
        </span>
      </span>
    ) : null;
  }

  render() {
    const { visualisation, width, height, showTitle } = this.props;
    const { visualisationType } = visualisation;
    const containerHeight = height || 400;
    const containerWidth = width || 800;
    const chartSize = getSize(containerWidth);
    const className = `Chart ${visualisationType} ${chartSize}`;
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
        {showTitle && (
          <div className="title">
            <h2 style={titleStyle}>
              <span>
                {getTitle(visualisation)}
              </span>
            </h2>
            <p className="chartMeta" style={metaStyle}>
              {this.renderLastUpdated()}
              {
                get(visualisation, 'data.common.metadata.sampled') ? (
                  <span> (<FormattedMessage id="using_sampled_data" />)</span>
                ) :
                null
              }
            </p>
          </div>
        )}
        {this.renderNewChart()}
      </div>
    );
  }
}
