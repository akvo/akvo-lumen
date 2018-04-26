import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@potion/layout'; // TODO: see if can optimize this
import { Rect, Svg, Group, Text } from '@potion/element';
import get from 'lodash/get';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { AxisLeft } from '@vx/axis';
import { Portal } from 'react-portal';
import merge from 'lodash/merge';
import { GridRows } from '@vx/grid';

import { sortAlphabetically } from '../../utilities/utils';
import Legend from './Legend';
import ResponsiveWrapper from '../common/ResponsiveWrapper';
import ColorPicker from '../common/ColorPicker';
import ChartLayout from './ChartLayout';
import Tooltip from './Tooltip';
import { labelFont } from '../../constants/chart';

const getDatum = (data, datum) => data.filter(({ key }) => key === datum)[0];

export default class SimpleBarChart extends Component {

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
    colors: PropTypes.array.isRequired,
    colorMapping: PropTypes.object,
    onChangeVisualisationSpec: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    legendPosition: PropTypes.oneOf(['right']),
    print: PropTypes.bool,
    interactive: PropTypes.bool,
    edit: PropTypes.bool,
    padding: PropTypes.number,
    marginLeft: PropTypes.number,
    marginRight: PropTypes.number,
    marginTop: PropTypes.number,
    marginBottom: PropTypes.number,
    style: PropTypes.object,
    legendVisible: PropTypes.bool,
    yAxisLabel: PropTypes.string,
    yAxisTicks: PropTypes.number,
    grid: PropTypes.bool,
  }

  static defaultProps = {
    interactive: true,
    marginLeft: 0.1,
    marginRight: 0.1,
    marginTop: 0.1,
    marginBottom: 0.2,
    legendVisible: false,
    edit: false,
    padding: 0.1,
    colorMapping: {},
    grid: true,
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
      data: series.data
        .sort((a, b) => sortAlphabetically(a, b, ({ key }) => key))
        .map(datum => ({ ...datum, value: Math.abs(datum.value) })),
    };
  }

  getColor(key, index) {
    const { colorMapping, colors } = this.props;
    return colorMapping[key] || colors[index];
  }

  handleShowTooltip(event, content) {
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
      tooltipItems: [content],
      tooltipPosition,
    });
  }

  handleMouseEnterNode({ key, value }, event) {
    if (this.state.isPickingColor) return;
    const { interactive, print, colors } = this.props;
    if (!interactive || print) return;
    this.handleShowTooltip(event, { key, color: colors[key], value });
    this.setState({ hoveredNode: key });
  }

  handleMouseEnterLegendNode({ key }) {
    if (this.state.isPickingColor) return;
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
      isPickingColor: edit ? key : null,
      hoveredNode: key,
    });
  }

  renderLabel({ key, nodeWidth, x, y, domain, value }) {
    const labelX = x + (nodeWidth / 2);
    if (domain[0] < 0) {
      const labelY = value < 0 ? y - 10 : y + 10;
      return (
        <Text
          textAnchor={value < 0 ? 'end' : 'start'}
          transform={[
            { type: 'rotate', value: [90, labelX, labelY] },
            { type: 'translate', value: [labelX, labelY] },
          ]}
          {...labelFont}
          fontWeight={get(this.state, 'hoveredNode') === key ? 700 : 400}
          onMouseEnter={(event) => {
            this.handleMouseEnterNode({ key, value }, event);
          }}
          onMouseMove={(event) => {
            this.handleMouseEnterNode({ key, value }, event);
          }}
          onMouseLeave={() => {
            this.handleMouseLeaveNode({ key });
          }}
        >
          {key}
        </Text>
      );
    }
    const labelY = y + 10;
    return (
      <Text
        textAnchor="start"
        transform={[
          { type: 'rotate', value: [45, labelX, labelY] },
          { type: 'translate', value: [labelX, labelY] },
        ]}
        {...labelFont}
        fontWeight={get(this.state, 'hoveredNode') === key ? 700 : 400}
        onMouseEnter={(event) => {
          this.handleMouseEnterNode({ key, value }, event);
        }}
        onMouseMove={(event) => {
          this.handleMouseEnterNode({ key, value }, event);
        }}
        onMouseLeave={() => {
          this.handleMouseLeaveNode({ key });
        }}
      >
        {key}
      </Text>
    );
  }

  render() {
    const {
      width,
      height,
      colors,
      onChangeVisualisationSpec,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      style,
      legendVisible,
      edit,
      padding,
      yAxisLabel,
      yAxisTicks,
      grid,
    } = this.props;

    const { tooltipItems, tooltipVisible, tooltipPosition } = this.state;

    const series = this.getData();

    if (!series) return null;

    const dataCount = series.data.length;

    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible={legendVisible}
        onClick={() => {
          this.setState({ isPickingColor: null });
        }}
        legend={({ horizontal }) => (
          <Legend
            horizontal={!horizontal}
            title={get(this.props, 'data.metadata.bucketColumnTitle')}
            data={series.data.map(({ key }) => key)}
            colorMapping={
              series.data.reduce((acc, { key }, i) => ({
                ...acc,
                [key]: this.getColor(key, i),
              }), {})
            }
            activeItem={get(this.state, 'hoveredNode')}
            onClick={({ datum }) => (event) => {
              this.handleClickNode({ ...getDatum(series.data, datum) }, event);
            }}
            onMouseEnter={({ datum }) => () => {
              if (this.state.isPickingColor) return;
              this.handleMouseEnterLegendNode(getDatum(series.data, datum));
            }}
          />
        )}
        chart={
          <ResponsiveWrapper>{(dimensions) => {
            const availableHeight = dimensions.height * (1 - marginBottom - marginTop);
            const availableWidth = dimensions.width * (1 - marginLeft - marginRight);

            const domain = extent(series.data, ({ value }) => value);
            if (domain[0] > 0) domain[0] = 0;

            const heightScale = scaleLinear()
              .domain([0, domain[1] - domain[0]])
              .range([availableHeight, 0]);

            const origin = heightScale(Math.abs(domain[0]));

            const axisScale = scaleLinear().domain(domain).range([0, availableHeight].reverse());

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
                <Svg width={dimensions.width} height={dimensions.height}>

                  {grid && (
                    <GridRows
                      scale={axisScale}
                      width={availableWidth}
                      height={availableHeight}
                      left={dimensions.width * marginLeft}
                      top={dimensions.height * marginTop}
                      numTicks={yAxisTicks}
                    />
                  )}

                  <Grid
                    data={series.data}
                    bands
                    size={[
                      dimensions.width * (1 - marginLeft - marginRight),
                      dimensions.height * (1 - marginTop - marginBottom),
                    ]}
                    rows={1}
                    // nodeEnter={d => ({ ...d, value: 0 })}
                    // animate
                  >{nodes => (
                    <Group
                      transform={{
                        translate: [
                          dimensions.width * marginLeft,
                          dimensions.height * marginTop,
                        ],
                      }}
                    >
                      {nodes.map(({ nodeWidth, x, key, value }, i) => {
                        const color = this.getColor(key, i);
                        const normalizedHeight = availableHeight - heightScale(Math.abs(value));
                        const colorpickerPlacement = i < dataCount / 2 ? 'right' : 'left';
                        const y = (value < 0) ? origin : origin - normalizedHeight;
                        return (
                          <Group key={key}>
                            {(this.state.isPickingColor === key) && (
                              <Portal node={this.wrap}>
                                <ColorPicker
                                  title={`Pick color: ${key}`}
                                  color={color}
                                  left={
                                    colorpickerPlacement === 'right' ?
                                      (dimensions.width * marginLeft) + x + nodeWidth :
                                      (dimensions.width * marginLeft) + x
                                  }
                                  top={y + (normalizedHeight / 2) + (dimensions.height * marginTop)}
                                  placement={colorpickerPlacement}
                                  onChange={({ hex }) => {
                                    onChangeVisualisationSpec({
                                      colors: { ...colors, [this.state.isPickingColor]: hex },
                                    });
                                    this.setState({ isPickingColor: null });
                                  }}
                                />
                              </Portal>
                            )}
                            <Rect
                              key={key}
                              x={x + (nodeWidth * padding)}
                              y={y}
                              width={nodeWidth - (nodeWidth * padding * 2)}
                              height={normalizedHeight}
                              fill={color}
                              stroke={color}
                              cursor={edit ? 'pointer' : 'default'}
                              onClick={(event) => {
                                this.handleClickNode({ key }, event);
                              }}
                              onMouseEnter={(event) => {
                                this.handleMouseEnterNode({ key, value }, event);
                              }}
                              onMouseMove={(event) => {
                                this.handleMouseEnterNode({ key, value }, event);
                              }}
                              onMouseLeave={() => {
                                this.handleMouseLeaveNode({ key });
                              }}
                            />
                            {this.renderLabel({
                              key,
                              value,
                              nodeWidth,
                              x,
                              y: origin,
                              domain,
                              height: normalizedHeight,
                            })}
                          </Group>
                        );
                      })}
                    </Group>
                  )}</Grid>

                  <AxisLeft
                    scale={axisScale}
                    left={dimensions.width * marginLeft}
                    top={dimensions.height * marginTop}
                    label={yAxisLabel || ''}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
                    numTicks={yAxisTicks}
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
