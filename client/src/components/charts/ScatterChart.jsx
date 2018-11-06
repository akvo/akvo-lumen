import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collection } from '@potion/layout'; // TODO: see if can optimize this
import { Circle, Svg, Group } from '@potion/element';
import { AxisBottom, AxisLeft } from '@vx/axis';
import get from 'lodash/get';
import { scaleLinear, scaleTime } from 'd3-scale';
import { extent } from 'd3-array';
import merge from 'lodash/merge';
import { GridRows, GridColumns } from '@vx/grid';
import itsSet from 'its-set';

import ColorPicker from '../common/ColorPicker';
import ResponsiveWrapper from '../common/ResponsiveWrapper';
import Tooltip from './Tooltip';
import ChartLayout from './ChartLayout';
import { heuristicRound, calculateMargins, getLabelFontSize } from '../../utilities/chart';
import { MAX_FONT_SIZE, MIN_FONT_SIZE } from '../../constants/chart';
import RenderComplete from './RenderComplete';

const startAxisFromZero = (axisExtent, type) => {
  // Returns an educated guess on if axis should start from zero or not
  const range = (axisExtent[1] - axisExtent[0]);
  const lowest = axisExtent[0];

  if (type !== 'number') {
    return false;
  }
  if (lowest < 0) {
    return false;
  }

  // Just a heurestic to do the "correct" thing
  const subjectiveDivisor = 2;
  if (range < (lowest / subjectiveDivisor)) {
    return false;
  }

  return true;
};

export default class ScatterChart extends Component {

  static propTypes = {
    data: PropTypes.shape({
      data: PropTypes.arrayOf(
        PropTypes.shape({
          key: PropTypes.string,
          x: PropTypes.number,
          y: PropTypes.number,
          r: PropTypes.number,
        })
      ),
      metadata: PropTypes.object,
    }),
    color: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    legendPosition: PropTypes.oneOf(['right']),
    print: PropTypes.bool,
    interactive: PropTypes.bool,
    edit: PropTypes.bool,
    marginLeft: PropTypes.number,
    marginRight: PropTypes.number,
    marginTop: PropTypes.number,
    marginBottom: PropTypes.number,
    onChangeVisualisationSpec: PropTypes.func,
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
    sizeLabel: PropTypes.string,
    yAxisTicks: PropTypes.number,
    xAxisTicks: PropTypes.number,
    opacity: PropTypes.number,
    style: PropTypes.object,
    legendVisible: PropTypes.bool,
    grid: PropTypes.bool,
    visualisation: PropTypes.object.isRequired,
  }

  static defaultProps = {
    marginLeft: 70,
    marginRight: 70,
    marginTop: 70,
    marginBottom: 70,
    opacity: 0.7,
    legendVisible: false,
    edit: false,
    grid: true,
    interactive: true,
  }

  static contextTypes = {
    abbrNumber: PropTypes.func,
  }

  state = {
    isPickingColor: false,
    hasRendered: false,
  }

  componentDidMount() {
    this.setState({ hasRendered: true }); // eslint-disable-line
  }

  getData() {
    const { data } = this.props;

    if (!get(data, 'series[0]')) return false;
    if (!get(data, 'series[1]')) return false;
    const sizeExists = get(data, 'series[2]');

    const values = data.series[0].data
      .map(({ value, ...rest }, i) => {
        const x = value;
        const y = data.series[1].data[i].value;
        let size;
        if (sizeExists) {
          size = data.series[2].data[i].value;
        }
        return {
          ...rest,
          x: x ? Math.abs(x) : x,
          y: y ? Math.abs(y) : y,
          size: size ? Math.abs(size) : size,
        };
      });
    const series = merge({}, data.common, { ...data.series[0], data: values });

    return {
      ...series,
      data: series.data
        .reduce((acc, datum) => (
          (itsSet(datum.x) && itsSet(datum.y)) ? acc.concat(datum) : acc
        ), []),
    };
  }

  handleShowTooltip(event, tooltipItems) {
    const { clientX, clientY } = event;
    const bounds = this.wrap.getBoundingClientRect();

    const x = clientX - bounds.left;
    const y = clientY - bounds.top;

    const tooltipPosition = {};

    if (x < bounds.width / 2) tooltipPosition.left = x + 20;
    else tooltipPosition.right = (bounds.width - x) + 20;

    if (y < bounds.height / 2) tooltipPosition.top = y - 12;
    else tooltipPosition.bottom = bounds.height - y - 12;

    this.setState({
      tooltipVisible: true,
      tooltipItems,
      tooltipPosition,
    });
  }

  handleMouseEnterNode({ key, x, y, size, label, color }, event) {
    const { interactive, print, xAxisLabel, yAxisLabel, sizeLabel, visualisation, data } = this.props;
    const xAxisType = get(data, 'series[0].metadata.type');
    const showColor =
      get(visualisation, 'spec.datapointLabelColumn') || get(visualisation, 'spec.bucketColumn');
    if (!interactive || print) return;
    let tooltipItems = [];

    if (showColor) {
      tooltipItems.push(
        { key: label, color }
      );
    }

    tooltipItems = tooltipItems.concat([
      { key: yAxisLabel || 'y', value: heuristicRound(y) },
      { key: xAxisLabel || 'x', value: xAxisType === 'date' ? new Date(x) : heuristicRound(x) },
    ]);

    if (get(data, 'series[2]')) { // size exists
      tooltipItems.push({ key: sizeLabel || 'size', value: heuristicRound(size) });
    }

    this.handleShowTooltip(event, tooltipItems);
    this.setState({ hoveredNode: key });
  }

  handleMouseEnterLegendNode({ key }) {
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    this.setState({ hoveredNode: key });
  }

  handleMouseLeaveNode() {
    this.setState({ tooltipVisible: false });
  }

  handleClickNode({ key }, event) {
    const { interactive, print, edit } = this.props;
    if (!interactive || print) return;
    event.stopPropagation();
    this.setState({
      isPickingColor: edit,
      hoveredNode: key,
    });
  }

  render() {
    const {
      data,
      width,
      height,
      color,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
      onChangeVisualisationSpec,
      opacity,
      style,
      legendVisible,
      xAxisLabel,
      yAxisLabel,
      xAxisTicks,
      yAxisTicks,
      grid,
      visualisation,
    } = this.props;

    const { tooltipItems, tooltipVisible, tooltipPosition, hasRendered } = this.state;
    const series = this.getData();

    if (!series) return null;

    const axisLabelFontSize =
      getLabelFontSize(yAxisLabel, xAxisLabel, MAX_FONT_SIZE, MIN_FONT_SIZE, height, width);

    const tickFormat = (value) => {
      const cutoff = 10000;
      if (cutoff >= 10000) {
        return this.context.abbrNumber(value);
      }
      return value;
    };

    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible={legendVisible}
        onClick={() => {
          this.setState({ isPickingColor: undefined });
        }}
        chart={
          <ResponsiveWrapper>{(dimensions) => {
            const margins = calculateMargins({
              top: marginTop,
              right: marginRight,
              bottom: marginBottom,
              left: marginLeft,
            }, dimensions);
            const availableHeight = dimensions.height - margins.bottom - margins.top;
            const availableWidth = dimensions.width - margins.left - margins.right;

            const xExtent = extent(series.data, ({ x }) => x);
            const xAxisType = get(data, 'series[0].metadata.type');
            const fromZero = startAxisFromZero(xExtent, xAxisType);

            if (fromZero) {
              xExtent[0] = 0;
            }

            const xScaleFunction = xAxisType === 'date' ? scaleTime : scaleLinear;
            let xScale = xScaleFunction()
              .domain(xExtent)
              .range([
                margins.left,
                dimensions.width - margins.right,
              ]);

            if (!fromZero && xAxisType === 'number') {
              xScale = xScale.nice();
            }

            const yExtent = extent(series.data, ({ y }) => y);
            if (yExtent[0] > 0) yExtent[0] = 0;
            const yScaleFunction = get(data, 'series[1].metadata.type') === 'date' ? scaleTime : scaleLinear;
            const yScale = yScaleFunction()
              .domain(yExtent)
              .range([
                dimensions.height - margins.bottom,
                margins.top,
              ]);

            let sizeScale = () => 25;

            if (get(data, 'series[2]')) { // size exists
              const sizeExtent = extent(series.data, ({ size }) => size);
              if (sizeExtent[0] > 0) sizeExtent[0] = 0;
              const sizeScaleFunction = get(data, 'series[2].metadata.type') === 'date' ? scaleTime : scaleLinear;
              sizeScale = sizeScaleFunction()
                .domain(sizeExtent)
                .range([
                  2,
                  ((availableWidth * availableHeight) / sizeExtent[1]) * 10,
                ]);
            }

            return (
              <div
                style={{ position: 'relative' }}
                ref={(c) => {
                  this.wrap = c;
                }}
              >
                {hasRendered && <RenderComplete id={visualisation.id} />}

                {this.state.isPickingColor && (
                  <ColorPicker
                    title="Pick color"
                    color={color}
                    onChange={({ hex }) => {
                      onChangeVisualisationSpec({ color: hex });
                      this.setState({ isPickingColor: undefined });
                    }}
                    left={dimensions.width / 2}
                    top={dimensions.height / 2}
                    style={{ transform: 'translateX(-50%) translateY(-50%)' }}
                  />
                )}
                {tooltipVisible && (
                  <Tooltip
                    items={tooltipItems}
                    {...tooltipPosition}
                  />
                )}
                <Svg width={dimensions.width} height={dimensions.height}>

                  {grid && (
                    <Group>
                      <GridRows
                        scale={yScale}
                        width={availableWidth}
                        height={availableHeight}
                        left={margins.left}
                        numTicks={yAxisTicks}
                      />
                      <GridColumns
                        scale={xScale}
                        width={availableWidth}
                        height={availableHeight}
                        top={margins.top}
                        numTicks={xAxisTicks}
                      />
                    </Group>
                  )}

                  <Collection data={series.data}>{nodes => (
                    <Group>
                      {nodes.map(({ key, x, y, size, label, r, category }, i) => {
                        const normalizedX = xScale(x);
                        const normalizedY = yScale(y);
                        const normalizedSize = Math.sqrt(sizeScale(size));

                        return (
                          <Group key={key || i}>
                            <Circle
                              key={i}
                              cx={normalizedX}
                              cy={normalizedY}
                              r={normalizedSize}
                              fill={color}
                              stroke={color}
                              strokeWidth={1}
                              fillOpacity={opacity}
                              onClick={(event) => {
                                this.handleClickNode({ key }, event);
                              }}
                              onMouseEnter={(event) => {
                                this.handleMouseEnterNode({ key, x, y, size, label, color }, event);
                              }}
                              onMouseMove={(event) => {
                                this.handleMouseEnterNode({ key, x, y, size, label, color }, event);
                              }}
                              onMouseLeave={() => {
                                this.handleMouseLeaveNode();
                              }}
                            />
                          </Group>
                        );
                      })}
                    </Group>
                  )}</Collection>

                  <AxisLeft
                    scale={yScale}
                    left={margins.left}
                    label={yAxisLabel || ''}
                    labelProps={{
                      dy: margins.top * 0.5,
                      textAnchor: 'middle',
                      fontFamily: 'Arial',
                      fontSize: axisLabelFontSize,
                      fill: 'black',
                    }}
                    labelOffset={44}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
                    numTicks={yAxisTicks}
                    tickFormat={tickFormat}
                  />

                  <AxisBottom
                    scale={xScale}
                    top={dimensions.height - margins.bottom}
                    label={xAxisLabel || ''}
                    labelProps={{
                      dx: margins.left * 0.5,
                      dy: margins.bottom - 50,
                      textAnchor: 'middle',
                      fontFamily: 'Arial',
                      fontSize: axisLabelFontSize,
                      fill: 'black',
                    }}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
                    numTicks={xAxisTicks}
                  />

                </Svg>
              </div>
            );
          }}</ResponsiveWrapper>
        }
      />
    );
  }

}
