import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collection } from '@potion/layout'; // TODO: see if can optimize this
import { Circle, Svg, Group, Area, Polyline } from '@potion/element';
import { AxisBottom, AxisLeft } from '@vx/axis';
import get from 'lodash/get';
import { scaleLinear, scaleTime } from 'd3-scale';
import { extent } from 'd3-array';
import merge from 'lodash/merge';

import { sortChronologically } from '../../utilities/utils';
import ResponsiveWrapper from '../ResponsiveWrapper';
import ColorPicker from '../ColorPicker';
import ChartLayout from './ChartLayout';
import Tooltip from './Tooltip';

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
    color: PropTypes.string.isRequired,
    onChangeVisualisationSpec: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    minRadius: PropTypes.number,
    maxRadius: PropTypes.number,
    legendPosition: PropTypes.oneOf(['right']),
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
  }

  static defaultProps = {
    marginLeft: 0.2,
    marginRight: 0.1,
    marginTop: 0.1,
    marginBottom: 0.2,
    opacity: 0.9,
    edit: false,
    area: false,
  }

  state = {
    isPickingColor: false,
  }

  getData() {
    const { data } = this.props;

    if (!get(data, 'series[0]')) return false;

    const series = merge({}, data.common, data.series[0]);

    return {
      ...series,
      data: series.data.sort((a, b) => sortChronologically(a, b, ({ timestamp }) => timestamp)),
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
        { key: yLabel, value: y },
      ],
      tooltipPosition,
    });
  }

  handleMouseEnterNode({ key, x, y }, event) {
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    if (this.state.isPickingColor) return;
    this.handleShowTooltip(event, { x, y, xLabel: 'x', yLabel: 'y' });
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
    } = this.props;
    const { tooltipItems, tooltipVisible, tooltipPosition } = this.state;

    const series = this.getData();

    if (!series) return null;

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
            const xScale = scaleTime()
              .domain([series.data[0].timestamp, series.data[series.data.length - 1].timestamp])
              .range([
                dimensions.width * marginLeft,
                dimensions.width * (1 - marginRight),
              ]);

            const yExtent = extent(series.data, ({ value }) => value);
            if (yExtent[0] > 0) yExtent[0] = 0;
            const yScale = scaleLinear()
              .domain(yExtent)
              .range([
                dimensions.height * (1 - marginBottom),
                dimensions.height * marginTop,
              ]);

            const origin = yScale(0);
            const radius = Math.min((5 / series.data.length) * 20, 5);

            return (
              <div
                style={{ position: 'relative' }}
                ref={(c) => {
                  this.wrap = c;
                }}
              >
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
                      this.setState({ isPickingColor: null });
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

                  <Collection data={series.data}>{nodes => (
                    <Group>
                      {area && (
                        <Area
                          points={series.data}
                          x={d => xScale(d.x)}
                          y1={d => yScale(d.y)}
                          y0={origin}
                          fill={color}
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
                        stroke={color}
                        strokeWidth={2}
                        onClick={(event) => {
                          this.handleClickNode({ key: null }, event);
                        }}
                      />

                      {nodes.map(({ key, timestamp, value }, i) => {
                        const normalizedX = xScale(timestamp);
                        const normalizedY = yScale(value);
                        return (
                          <Group>
                            <Circle
                              key={i}
                              cx={normalizedX}
                              cy={normalizedY}
                              r={radius}
                              fill="white"
                              stroke={color}
                              strokeWidth={2}
                              onClick={(event) => {
                                this.handleClickNode({ key }, event);
                              }}
                              onMouseEnter={(event) => {
                                this.handleMouseEnterNode({ key, x: timestamp, y: value }, event);
                              }}
                            />
                          </Group>
                        );
                      })}
                    </Group>
                  )}</Collection>

                  <AxisLeft
                    scale={yScale}
                    left={xScale(series.data[0].timestamp)}
                    label={yAxisLabel || ''}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
                  />

                  <AxisBottom
                    scale={xScale}
                    top={origin}
                    label={xAxisLabel || ''}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
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
