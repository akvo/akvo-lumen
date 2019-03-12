import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collection } from '@potion/layout'; // TODO: see if can optimize this
import { Circle, Svg, Group, Area, Polyline } from '@potion/element';
import { AxisBottom, AxisLeft } from '@vx/axis';
import get from 'lodash/get';
import { scaleLinear, scaleTime } from 'd3-scale';
import { extent } from 'd3-array';
import merge from 'lodash/merge';
import { GridRows, GridColumns } from '@vx/grid';
import itsSet from 'its-set';

import { sortChronologically, filterNullData } from '../../utilities/utils';
import { heuristicRound, calculateMargins, getLabelFontSize } from '../../utilities/chart';
import { MAX_FONT_SIZE, MIN_FONT_SIZE } from '../../constants/chart';
import ResponsiveWrapper from '../common/ResponsiveWrapper';
import ColorPicker from '../common/ColorPicker';
import ChartLayout from './ChartLayout';
import RenderComplete from './RenderComplete';
import Tooltip from './Tooltip';

const formatValue = (value, type) => {
  if (type === 'date') {
    return new Date(value);
  }
  return value;
};

export default class LineChart extends Component {

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
    color: PropTypes.string,
    onChangeVisualisationSpec: PropTypes.func,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    minRadius: PropTypes.number,
    maxRadius: PropTypes.number,
    legendPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left', undefined]),
    print: PropTypes.bool,
    interactive: PropTypes.bool,
    edit: PropTypes.bool,
    marginLeft: PropTypes.number,
    marginRight: PropTypes.number,
    marginTop: PropTypes.number,
    marginBottom: PropTypes.number,
    opacity: PropTypes.number,
    style: PropTypes.object,
    area: PropTypes.bool,
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
    yAxisTicks: PropTypes.number,
    xAxisTicks: PropTypes.number,
    grid: PropTypes.bool,
    visualisation: PropTypes.object,
  }

  static defaultProps = {
    marginLeft: 70,
    marginRight: 70,
    marginTop: 20,
    marginBottom: 80,
    opacity: 0.9,
    edit: false,
    area: false,
    grid: true,
    interactive: true,
  }

  static contextTypes = {
    abbrNumber: PropTypes.func,
  }

  state = {
    isPickingColor: undefined,
    hasRendered: false,
  }

  componentDidMount() {
    this.setState({ hasRendered: true }); // eslint-disable-line
  }

  getData() {
    const { data } = this.props;

    if (!get(data, 'series[0]')) return false;

    const series = merge({}, data.common, data.series[0]);

    return {
      ...series,
      data: series.data
        .filter(itsSet)
        .sort((a, b) => sortChronologically(a, b, ({ timestamp }) => timestamp))
        .reduce((acc, datum) => (
          itsSet(datum.value) ? acc.concat(datum) : acc
        ), []),
    };
  }

  handleShowTooltip(event, { xLabel, x, yLabel, y }) {
    const { clientX, clientY } = event;
    const bounds = this.wrap.getBoundingClientRect();

    const xPos = clientX - bounds.left;
    const yPos = clientY - bounds.top;

    const tooltipPosition = {};

    if (xPos < bounds.width / 2) tooltipPosition.left = xPos + 20;
    else tooltipPosition.right = (bounds.width - xPos) + 20;

    if (yPos < bounds.height / 2) tooltipPosition.top = yPos - 12;
    else tooltipPosition.bottom = bounds.height - yPos - 12;

    this.setState({
      tooltipVisible: true,
      tooltipItems: [
        { key: xLabel, value: x },
        { key: yLabel, value: heuristicRound(y) },
      ],
      tooltipPosition,
    });
  }

  handleMouseEnterNode({ key, x, y }, event) {
    const { interactive, print, xAxisLabel, yAxisLabel } = this.props;
    if (!interactive || print) return;
    if (this.state.isPickingColor) return;
    this.handleShowTooltip(event, { x, y, xLabel: xAxisLabel || 'x', yLabel: yAxisLabel || 'y' });
    this.setState({ hoveredNode: key });
  }

  handleMouseLeaveNode() {
    this.setState({ labelVisible: false });
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
      width,
      height,
      color,
      onChangeVisualisationSpec,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
      style,
      area,
      xAxisLabel,
      yAxisLabel,
      yAxisTicks,
      grid,
      visualisation,
    } = this.props;

    const { tooltipItems, tooltipVisible, tooltipPosition, hasRendered } = this.state;

    const xAxisTicks = 8;

    const series = this.getData();

    if (!series) return null;

    series.data = filterNullData(series.data);

    const axisLabelFontSize =
      getLabelFontSize(yAxisLabel, xAxisLabel, MAX_FONT_SIZE, MIN_FONT_SIZE, height, width);

    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible={false}
        onClick={() => {
          this.setState({ isPickingColor: null });
        }}
        chart={
          <ResponsiveWrapper>{(dimensions) => {
            if (!series.data.length) return null;

            const margins = calculateMargins({
              top: marginTop,
              right: marginRight,
              bottom: marginBottom,
              left: marginLeft,
            }, dimensions);
            const availableHeight = dimensions.height - margins.bottom - margins.top;
            const availableWidth = dimensions.width - margins.left - margins.right;

            const xDomain = [
              series.data[0].timestamp,
              series.data[series.data.length - 1].timestamp,
            ];
            const xScale = series.metadata.type === 'date' ?
              scaleTime()
                .domain(xDomain)
                .range([
                  margins.left,
                  dimensions.width - margins.right,
                ]) :
              scaleLinear()
                .domain(xDomain)
                .range([
                  margins.left,
                  dimensions.width - margins.right,
                ]);

            const yExtent = extent(series.data, ({ value }) => value);
            if (yExtent[0] > 0) yExtent[0] = 0;
            const yScale = scaleLinear()
              .domain(yExtent)
              .range([
                dimensions.height - margins.bottom,
                margins.top,
              ]);

            const origin = yScale(0);
            const radius = Math.min((5 / series.data.length) * 20, 5);
            const numNodes = series.data.length;
            const maxNodesForTooltip = 50;
            const showTooltip = numNodes <= maxNodesForTooltip;
            const abbreviateNumber = value => this.context.abbrNumber(value);

            const xTickFormatConditional = series.metadata.type === 'number' ?
              { tickFormat: abbreviateNumber } : {};
            const yTickFormat = (num) => {
              if (num >= 10000) {
                return abbreviateNumber(num);
              }
              return num;
            };

            return (
              <div
                style={{ position: 'relative' }}
                ref={(c) => {
                  this.wrap = c;
                }}
              >
                {hasRendered && visualisation && <RenderComplete id={visualisation.id} />}

                {tooltipVisible && (
                  <Tooltip
                    items={tooltipItems}
                    {...tooltipPosition}
                  />
                )}

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

                <Svg
                  width={dimensions.width}
                  height={dimensions.height}
                  onClick={() => {
                    this.setState({ hoveredNode: null, tooltipVisible: false });
                  }}
                >

                  {grid && (
                    <Group>
                      <GridRows
                        scale={yScale}
                        width={availableWidth}
                        height={availableHeight}
                        left={xScale(series.data[0].timestamp)}
                        numTicks={yAxisTicks}
                      />
                      <GridColumns
                        scale={xScale}
                        width={availableWidth}
                        height={availableHeight}
                        top={origin - availableHeight}
                        numTicks={xAxisTicks}
                      />
                    </Group>
                  )}

                  <Collection data={series.data}>{nodes => (
                    <Group>
                      {area && (
                        <Area
                          points={series.data}
                          x={d => xScale(d.timestamp)}
                          y1={d => yScale(d.value)}
                          y0={origin}
                          fill={this.props.color}
                          fillOpacity={0.6}
                          onClick={(event) => {
                            this.handleClickNode({ key: null }, event);
                          }}
                        />
                      )}

                      <Polyline
                        points={series.data}
                        x={d => xScale(d.timestamp)}
                        y={d => yScale(d.value)}
                        fill="none"
                        stroke={this.props.color}
                        strokeWidth={1}
                        onClick={(event) => {
                          this.handleClickNode({ key: null }, event);
                        }}
                      />

                      {showTooltip && nodes.map(({ key, timestamp, value }, i) => {
                        const normalizedX = xScale(timestamp);
                        const normalizedY = yScale(value);
                        return (
                          <Group key={i}>
                            <Circle
                              cx={normalizedX}
                              cy={normalizedY}
                              r={radius}
                              fill="white"
                              stroke={this.props.color}
                              strokeWidth={2}
                              onClick={(event) => {
                                this.handleClickNode({ key }, event);
                              }}
                              onMouseEnter={(event) => {
                                this.handleMouseEnterNode({
                                  key,
                                  x: formatValue(timestamp, series.metadata.type),
                                  y: value,
                                }, event);
                              }}
                            />
                          </Group>
                        );
                      })}
                    </Group>
                  )}</Collection>

                  <AxisLeft
                    scale={yScale}
                    left={xScale((xDomain[0] < 0 && xDomain[1] > 0) ? 0 : xDomain[0])}
                    label={yAxisLabel || ''}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
                    numTicks={yAxisTicks}
                    tickFormat={yTickFormat}
                    labelProps={{
                      dy: margins.top * 0.5,
                      textAnchor: 'middle',
                      fontFamily: 'Arial',
                      fontSize: axisLabelFontSize,
                      fill: 'black',
                    }}
                    labelOffset={44}
                  />

                  <AxisBottom
                    top={origin}
                    scale={xScale}
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
                    tickLabelProps={val => ({
                      transform: `rotate(45, ${xScale(val)}, 18)`,
                      fontSize: 10,
                    })}
                    {...xTickFormatConditional}
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
