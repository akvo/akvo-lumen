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

import { heuristicRound, replaceLabelIfValueEmpty, calculateMargins } from '../../utilities/chart';
import Legend from './Legend';
import ResponsiveWrapper from '../common/ResponsiveWrapper';
import ColorPicker from '../common/ColorPicker';
import ChartLayout from './ChartLayout';
import Tooltip from './Tooltip';
import { labelFont, MAX_FONT_SIZE } from '../../constants/chart';

const getDatum = (data, datum) => data.filter(({ key }) => key === datum)[0];

const getLabelText = (label, type) => {
  const o = type === 'date' ?
    `${new Date(label * 1000)}` : replaceLabelIfValueEmpty(label);

  return o;
};

const getPaddingBottom = (data, type) => {
  const labelCutoffLength = 16;
  const longestLabelLength =
    Math.min(
      labelCutoffLength,
      data
        .map(({ label }) => String(getLabelText(label, type)))
        .sort((a, b) => b.length - a.length)[0].length
    );
  const pixelsPerChar = 3.5;

  return Math.ceil(longestLabelLength * pixelsPerChar);
};

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
    defaultColor: PropTypes.string.isRequired,
    onChangeVisualisationSpec: PropTypes.func,
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
    xAxisLabel: PropTypes.string,
    grid: PropTypes.bool,
  }

  static defaultProps = {
    interactive: true,
    marginLeft: 0.1,
    marginRight: 0.1,
    marginTop: 0.1,
    marginBottom: 0.1,
    legendVisible: false,
    edit: false,
    padding: 0.1,
    colorMapping: {},
    grid: true,
  }

  static contextTypes = {
    abbrNumber: PropTypes.func,
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
        .map(datum => ({ ...datum, value: Math.abs(datum.value) })),
    };
  }

  getColor(key, index, numColors) {
    const { colorMapping, colors, defaultColor } = this.props;

    if (colorMapping[key]) {
      return colorMapping[key];
    }

    return numColors > colors.length ? defaultColor : colors[index];
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
    this.handleShowTooltip(event, { key, color: colors[key], value: heuristicRound(value) });
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
      isPickingColor: edit ? key : undefined,
      hoveredNode: key,
    });
  }

  renderLabel({ key, nodeWidth, x, y, domain, value, type }) {
    let labelText = String(getLabelText(value, type));
    labelText = labelText.length <= 16 ?
      labelText : `${labelText.substring(0, 13)}…`;

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
          {labelText}
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
        {labelText}
      </Text>
    );
  }

  render() {
    const {
      width,
      height,
      colorMapping,
      onChangeVisualisationSpec,
      marginTop,
      marginRight,
      marginLeft,
      marginBottom,
      style,
      legendVisible,
      edit,
      padding,
      yAxisLabel,
      yAxisTicks,
      xAxisLabel,
      grid,
    } = this.props;

    const { tooltipItems, tooltipVisible, tooltipPosition } = this.state;

    const series = this.getData();

    if (!series) return null;

    const dataType = series.metadata.type;
    const paddingBottom = getPaddingBottom(series.data, dataType);
    const dataCount = series.data.length;
    let yAxisLabelSize = 10;
    if ((yAxisLabel || '').length > 60) yAxisLabelSize = 7;
    if ((yAxisLabel || '').length > 100) yAxisLabelSize = 5;
    let xAxisLabelSize = 10;
    if ((xAxisLabel || '').length > 60) xAxisLabelSize = 7;
    if ((xAxisLabel || '').length > 100) xAxisLabelSize = 5;
    const yAxisLabelSizeMultiplier = height / 600;
    const xAxisLabelSizeMultiplier = width / 600;

    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible={legendVisible}
        onClick={() => {
          this.setState({ isPickingColor: undefined });
        }}
        legend={({ horizontal }) => (
          <Legend
            horizontal={!horizontal}
            title={get(this.props, 'data.metadata.bucketColumnTitle')}
            data={series.data.map(({ key }) => key)}
            colorMapping={
              series.data.reduce((acc, { key }, i) => ({
                ...acc,
                [key]: this.getColor(key, i, series.data.length),
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
            const margins = calculateMargins({
              top: marginTop,
              right: marginRight,
              bottom: marginBottom,
              left: marginLeft,
            }, dimensions);
            const availableHeight = dimensions.height - margins.bottom - margins.top - paddingBottom; // eslint-disable-line
            const availableWidth = dimensions.width - margins.left - margins.right;

            const domain = extent(series.data, ({ value }) => value);
            if (domain[0] > 0) domain[0] = 0;

            const heightScale = scaleLinear()
              .domain([0, domain[1] - domain[0]])
              .range([availableHeight, 0]);

            const origin = heightScale(Math.abs(domain[0]));

            const axisScale = scaleLinear().domain(domain).range([0, availableHeight].reverse());

            const tickFormat = (value) => {
              const cutoff = 10000;
              if (cutoff >= 10000) {
                return this.context.abbrNumber(value);
              }
              return value;
            };

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
                      left={margins.left}
                      top={margins.top}
                      numTicks={yAxisTicks}
                    />
                  )}

                  <Grid
                    data={series.data}
                    bands
                    size={[
                      dimensions.width - margins.left - margins.right,
                      dimensions.height - margins.top - margins.bottom - paddingBottom,
                    ]}
                    rows={1}
                  >{nodes => (
                    <Group
                      transform={{
                        translate: [margins.left, margins.top],
                      }}
                    >
                      {nodes.map(({ nodeWidth, x, key, value }, i) => {
                        const color = this.getColor(key, i, nodes.length);
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
                                      margins.left + x + nodeWidth :
                                      margins.left + x
                                  }
                                  top={y + (normalizedHeight / 2) + margins.top}
                                  placement={colorpickerPlacement}
                                  onChange={({ hex }) => {
                                    onChangeVisualisationSpec({
                                      colors: { ...colorMapping, [this.state.isPickingColor]: hex },
                                    });
                                    this.setState({ isPickingColor: undefined });
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
                              value: key,
                              nodeWidth,
                              x,
                              y: origin,
                              domain,
                              height: normalizedHeight,
                              type: dataType,
                            })}
                          </Group>
                        );
                      })}
                    </Group>
                  )}</Grid>

                  <AxisLeft
                    scale={axisScale}
                    left={margins.left}
                    top={margins.top}
                    label={yAxisLabel || ''}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
                    numTicks={yAxisTicks}
                    labelProps={{
                      fontSize: Math.min(yAxisLabelSize * yAxisLabelSizeMultiplier, MAX_FONT_SIZE),
                      textAnchor: 'middle',
                    }}
                    tickFormat={tickFormat}
                  />

                  <Text
                    transform={[
                      { type: 'translate', value: [Math.floor(this.props.width / 2), this.props.height - 5] },
                    ]}
                    fontSize={Math.min(xAxisLabelSize * xAxisLabelSizeMultiplier, MAX_FONT_SIZE)}
                    textAnchor="middle"
                    fontFamily="Arial"
                  >
                    {xAxisLabel || ''}
                  </Text>

                </Svg>
              </div>
            );
          }}</ResponsiveWrapper>
        }
      />
    );
  }

}
