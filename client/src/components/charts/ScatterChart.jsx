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
    yAxisTicks: PropTypes.number,
    xAxisTicks: PropTypes.number,
    opacity: PropTypes.number,
    style: PropTypes.object,
    legendVisible: PropTypes.bool,
    grid: PropTypes.bool,
  }

  static defaultProps = {
    marginLeft: 0.2,
    marginRight: 0.1,
    marginTop: 0.1,
    marginBottom: 0.2,
    opacity: 0.9,
    legendVisible: false,
    edit: false,
    grid: true,
    interactive: true,
  }

  state = {
    isPickingColor: false,
  }

  getData() {
    const { data } = this.props;

    if (!get(data, 'series[0]')) return false;

    const values = data.series[0].data
      .map(({ value, ...rest }, i) => {
        const x = value;
        const y = data.series[1].data[i].value;
        return {
          ...rest,
          x: x ? Math.abs(x) : x,
          y: y ? Math.abs(y) : y,
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

  handleMouseEnterNode({ key, x, y, label, color }, event) {
    const { interactive, print, xAxisLabel, yAxisLabel } = this.props;
    if (!interactive || print) return;
    this.handleShowTooltip(event, [
      { key: label, color },
      { key: yAxisLabel || 'y', value: y },
      { key: xAxisLabel || 'x', value: x },
    ]);
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
    } = this.props;

    const { tooltipItems, tooltipVisible, tooltipPosition } = this.state;
    const series = this.getData();

    if (!series) return null;

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
            const availableHeight = dimensions.height * (1 - marginBottom - marginTop);
            const availableWidth = dimensions.width * (1 - marginLeft - marginRight);

            const xExtent = extent(series.data, ({ x }) => x);
            const fromZero = startAxisFromZero(xExtent, get(data, 'series[0].metadata.type'));
            if (fromZero) xExtent[0] = 0;

            const xScaleFunction = get(data, 'series[0].metadata.type') === 'date' ? scaleTime : scaleLinear;
            const xScale = xScaleFunction()
              .domain(xExtent)
              .range([
                dimensions.width * marginLeft,
                dimensions.width * (1 - marginRight),
              ]);

            const yExtent = extent(series.data, ({ y }) => y);
            if (yExtent[0] > 0) yExtent[0] = 0;
            const yScaleFunction = get(data, 'series[1].metadata.type') === 'date' ? scaleTime : scaleLinear;
            const yScale = yScaleFunction()
              .domain(yExtent)
              .range([
                dimensions.height * (1 - marginBottom),
                dimensions.height * marginTop,
              ]);

            const radius = 5;

            return (
              <div
                style={{ position: 'relative' }}
                ref={(c) => {
                  this.wrap = c;
                }}
              >
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
                        left={dimensions.width * marginLeft}
                        numTicks={yAxisTicks}
                      />
                      <GridColumns
                        scale={xScale}
                        width={availableWidth}
                        height={availableHeight}
                        top={dimensions.height * marginTop}
                        numTicks={xAxisTicks}
                      />
                    </Group>
                  )}

                  <Collection data={series.data}>{nodes => (
                    <Group>
                      {nodes.map(({ key, x, y, label, r, category }, i) => {
                        const normalizedX = xScale(x);
                        const normalizedY = yScale(y);

                        return (
                          <Group key={key}>
                            <Circle
                              key={i}
                              cx={normalizedX}
                              cy={normalizedY}
                              r={radius}
                              fill={color}
                              stroke={color}
                              strokeWidth={2}
                              fillOpacity={opacity}
                              onClick={(event) => {
                                this.handleClickNode({ key }, event);
                              }}
                              onMouseEnter={(event) => {
                                this.handleMouseEnterNode({ key, x, y, label, color }, event);
                              }}
                              onMouseMove={(event) => {
                                this.handleMouseEnterNode({ key, x, y, label, color }, event);
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
                    left={dimensions.width * marginLeft}
                    label={yAxisLabel || ''}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
                    numTicks={yAxisTicks}
                  />

                  <AxisBottom
                    scale={xScale}
                    top={dimensions.height * (1 - marginBottom)}
                    label={xAxisLabel || ''}
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
