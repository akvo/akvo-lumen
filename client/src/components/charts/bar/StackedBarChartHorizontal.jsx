import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@potion/layout'; // TODO: see if can optimize this
import { Rect, Svg, Group, Text } from '@potion/element';
import get from 'lodash/get';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { AxisBottom } from '@vx/axis';
import { Portal } from 'react-portal';
import merge from 'lodash/merge';
import { stack } from 'd3-shape';
import { GridColumns } from '@vx/grid';
import itsSet from 'its-set';
import { stackedBarPropTypes, stackedBarDefaultsProps } from './CommonBarChart';

import { abbr } from '../../../utilities/utils';
import {
  heuristicRound,
  replaceLabelIfValueEmpty,
  calculateMargins,
  getLabelFontSize,
  labelFitsWidth,
  labelFitsHeight,
} from '../../../utilities/chart';
import Legend from '../Legend';
import ResponsiveWrapper from '../../common/ResponsiveWrapper';
import ColorPicker from '../../common/ColorPicker';
import ChartLayout from '../ChartLayout';
import Tooltip from '../Tooltip';
import { labelFont, MAX_FONT_SIZE, MIN_FONT_SIZE, LABEL_CHAR_WIDTH } from '../../../constants/chart';
import RenderComplete from '../RenderComplete';
import { isLight } from '../../../utilities/color';

const getPaddingBottom = (data) => {
  const labelCutoffLength = 16;
  const longestLabelLength =
    Math.min(
      labelCutoffLength,
      data
        .map(({ label }) => String(replaceLabelIfValueEmpty(label)))
        .sort((a, b) => b.length - a.length)[0].length
    );
  const pixelsPerChar = 3.5;

  return Math.ceil(longestLabelLength * pixelsPerChar);
};


const getData = (props) => { // eslint-disable-line
  const { data } = props;

  if (!get(data, 'series[0]')) return false;
  const values = data.series[0].data
    .filter(itsSet)
    .reduce((acc, { value }, i) =>
      [
        ...acc,
        data.series.reduce((acc2, series) => (itsSet(series) ? {
          ...acc2,
          values: {
            ...acc2.values,
            [series.key]: series.data[i].value,
          },
        } : acc2), {}),
      ]
    , []);

  const series = merge({}, data.common, { data: values });
  const combinedData = series.data.sort((a, b) => a.key - b.key);

  return {
    ...series,
    data: combinedData,
    stack: stack()
      .keys(Object.keys(combinedData[0].values))
      .value((d, key) => Math.abs(d[key]))(combinedData.map(datum => datum.values)),
  };
};


export default class StackedBarChart extends Component {

  static propTypes = stackedBarPropTypes;

  static defaultProps =
  { ...stackedBarDefaultsProps,
    xAxisLabel: '',
  };

  static contextTypes = {
    abbrNumber: PropTypes.func,
  }

  constructor(props) {
    super(props);
    this.state = {
      isPickingColor: false,
      data: getData(props),
      hasRendered: false,
    };
  }

  componentDidMount() {
    this.setState({ hasRendered: true }); // eslint-disable-line
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromProps(props, state) {
    return { data: getData(props) };
  }

  getColor(key, index) {
    const { colorMapping, colors } = this.props;
    return colorMapping[key] || colors[index];
  }

  getMarginLeft(series) {
    const { xAxisLabel, marginLeft, width } = this.props;
    const longestLabel = series.data.concat(xAxisLabel).reduce((acc, { label }) =>
      Math.max(acc, `${label}`.length)
    , 0);
    return Math.min(Math.min(marginLeft, longestLabel * LABEL_CHAR_WIDTH), width / 2);
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
      tooltipItems: content,
      tooltipPosition,
    });
  }

  handleMouseEnterNode(node, { seriesKey, valueKey, seriesIndex }, event) {
    if (this.state.isPickingColor) return;
    const { interactive, print, yAxisLabel } = this.props;
    if (!interactive || print) return;
    const nodeTotal = Object.keys(node.values).reduce((acc, key) => acc + node.values[key], 0);
    const percentage = Math.round((node.values[seriesKey] / nodeTotal) * 10000) / 100;
    this.handleShowTooltip(event, [
      { key: seriesKey, color: this.getColor(seriesKey, seriesIndex), value: valueKey },
      { key: yAxisLabel || 'x', value: `${heuristicRound(node.values[seriesKey])} (${percentage}%)` },
    ]);
    this.setState({ hoveredNode: { seriesKey, valueKey } });
  }

  handleMouseEnterLegendNode(seriesKey) {
    if (this.state.isPickingColor) return;
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    this.setState({ hoveredSeries: seriesKey });
  }

  handleMouseLeaveLegendNode() {
    this.setState({ hoveredSeries: undefined });
  }

  handleMouseLeaveNode() {
    this.setState({ tooltipVisible: false });
  }

  handleClickNode(node, event) {
    const { interactive, print, edit } = this.props;
    if (!interactive || print) return;
    event.stopPropagation();
    const isPickingColor = edit ? node : undefined;
    this.setState({
      isPickingColor,
      tooltipVisible: !isPickingColor,
      hoveredNode: node,
    });
  }

  renderLabel({ nodeHeight, x, y, node, index, nodeCount, maxChars }) {
    if (
      (nodeCount >= 200 && index % 10 !== 0) ||
      (nodeCount < 200 && nodeCount > 40 && index % 5 !== 0)
    ) return null;
    const labelText = abbr(String(replaceLabelIfValueEmpty(node.key)), maxChars);

    const labelX = x - 10;
    const labelY = y + (nodeHeight / 2);
    return (
      <Text
        textAnchor="end"
        transform={[
          { type: 'translate', value: [labelX, labelY] },
        ]}
        {...labelFont}
        fontWeight={get(this.state, 'hoveredNode.valueKey') === node.key ? 700 : 400}
      >
        {labelText}
      </Text>
    );
  }

  renderValueLabel({
    key,
    x,
    y,
    color,
    barHeight,
    barWidth,
    node,
    seriesKey,
    seriesIndex,
  }) {
    const { subBucketMethod, valueLabelsVisible } = this.props;

    if (!valueLabelsVisible) return null;

    let labelText;
    if (subBucketMethod === 'stack_percentage') {
      const nodeTotal = Object.keys(node.values).reduce((acc, k) => acc + node.values[k], 0);
      const percentage = Math.round((node.values[seriesKey] / nodeTotal) * 100);
      labelText = `${percentage}%`;
    } else {
      labelText = heuristicRound(node.values[seriesKey]);
    }

    const labelX = x;
    const labelY = y + (barHeight / 2);

    if (!labelFitsWidth(labelText, barWidth) || !labelFitsHeight(barHeight)) return null;

    return (
      <Text
        textAnchor="middle"
        alignmentBaseline="center"
        transform={[
          // { type: 'rotate', value: [90, labelX, labelY] },
          { type: 'translate', value: [labelX, labelY] },
        ]}
        {...labelFont}
        fill={isLight(color) ? labelFont.fill : 'white'}
        fontWeight={get(this.state, 'hoveredNode') === key ? 700 : 400}
        onMouseEnter={(event) => {
          this.handleMouseEnterNode(
            node,
            { seriesKey, valueKey: key, seriesIndex },
            event
          );
        }}
        onMouseMove={(event) => {
          this.handleMouseEnterNode(
            node,
            { seriesKey, valueKey: key, seriesIndex },
            event
          );
        }}
        onMouseLeave={this.handleMouseLeaveNode}
      >
        {labelText}
      </Text>
    );
  }

  renderSplit() {
    const {
      width,
      height,
      colorMapping,
      onChangeVisualisationSpec,
      marginTop,
      marginRight,
      marginBottom,
      style,
      legendVisible,
      legendPosition,
      labelsVisible,
      legendTitle,
      edit,
      padding,
      yAxisLabel,
      yAxisTicks,
      xAxisLabel,
      grid,
      visualisation,
    } = this.props;

    const { tooltipItems, tooltipVisible, tooltipPosition, hasRendered } = this.state;

    const series = this.state.data;

    if (!series) return null;

    const marginLeft = this.getMarginLeft(series);
    const stackNodes = series.stack;
    const dataCount = series.data.length;
    const seriesCount = this.props.data.series.length;
    const paddingBottom = getPaddingBottom(series.data);
    const axisLabelFontSize = getLabelFontSize(
      yAxisLabel,
      xAxisLabel,
      MAX_FONT_SIZE,
      MIN_FONT_SIZE,
      height,
      width
    );
    const maxLabelChars = Math.floor(marginLeft / LABEL_CHAR_WIDTH);
    const labelSizeToAxisLabelSize = Math.ceil(axisLabelFontSize / labelFont.fontSize);

    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible={legendVisible}
        legendPosition={legendPosition}
        onClick={() => {
          this.setState({ isPickingColor: undefined });
        }}
        legend={({ horizontal }) => (
          <Legend
            horizontal={!horizontal}
            title={legendTitle}
            data={stackNodes.map(({ key }) => replaceLabelIfValueEmpty(key))}
            colorMapping={
              stackNodes.reduce((acc, { key }, i) => ({
                ...acc,
                [replaceLabelIfValueEmpty(key)]: this.getColor(key, i),
              }), {})
            }
            // activeItem={get(this.state, 'hoveredNode.seriesKey')}
            onClick={({ datum }) => (event) => {
              this.handleClickNode(datum, event);
            }}
            onMouseEnter={({ datum }) => () => {
              if (this.state.isPickingColor) return;
              this.handleMouseEnterLegendNode(datum);
            }}
            onMouseLeave={() => () => {
              this.handleMouseLeaveLegendNode();
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

            const availableHeight =
              dimensions.height - margins.bottom - margins.top - paddingBottom;
            const availableWidth = dimensions.width - margins.left - margins.right;

            const domain = extent(series.data, ({ values }) =>
              Object.keys(values).reduce((acc, key) => Math.max(acc, Math.abs(values[key])), 0)
            );

            if (domain[0] > 0) domain[0] = 0;

            const widthScale = scaleLinear()
              .domain([0, domain[1]])
              .range([0, availableWidth]);

            const origin = widthScale(0);

            const axisScale = scaleLinear()
              .domain([0, domain[1]])
              .range([0, availableWidth]);

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
                {hasRendered && visualisation && <RenderComplete id={visualisation.id} />}

                {tooltipVisible && (
                  <Tooltip
                    items={tooltipItems}
                    {...tooltipPosition}
                  />
                )}
                <Svg width={dimensions.width} height={dimensions.height}>

                  {grid && (
                    <GridColumns
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
                    cols={1}
                  >{nodes => (
                    <Group
                      transform={{
                        translate: [margins.left, margins.top],
                      }}
                    >
                      {stackNodes.map((stackSeries, seriesIndex) => {
                        const seriesKey = stackSeries.key;
                        const seriesIsNotHovered = (
                          this.state.hoveredSeries &&
                          this.state.hoveredSeries !== seriesKey
                        );

                        return (
                          <Group key={seriesKey}>
                            {stackSeries.map(([y0, y1], valueIndex) => {
                              const node = nodes[valueIndex];
                              const { nodeHeight, x, y, key } = nodes[valueIndex];
                              const color = this.getColor(seriesKey, seriesIndex);
                              const normalizedX = widthScale(y0);
                              const normalizedWidth = widthScale(y1) - normalizedX;
                              const colorpickerPlacement = valueIndex < dataCount / 2 ? 'right' : 'left';
                              const barHeight = (nodeHeight - (nodeHeight * padding * 2)) /
                                seriesCount;

                              return (
                                <Group key={key}>
                                  {(
                                    get(this.state, 'isPickingColor') &&
                                    get(this.state, 'isPickingColor.valueKey') === key &&
                                    get(this.state, 'isPickingColor.seriesKey') === seriesKey
                                  ) && (
                                    <Portal node={this.wrap}>
                                      <ColorPicker
                                        title={`Pick color: ${key}`}
                                        color={color}
                                        left={
                                          colorpickerPlacement === 'right' ?
                                            margins.left + x + nodeHeight :
                                            margins.left + x
                                        }
                                        top={normalizedX}
                                        placement={colorpickerPlacement}
                                        onChange={({ hex }) => {
                                          onChangeVisualisationSpec({
                                            colors: {
                                              ...colorMapping,
                                              [this.state.isPickingColor.seriesKey]: hex,
                                            },
                                          });
                                          this.setState({ isPickingColor: undefined });
                                        }}
                                      />
                                    </Portal>
                                  )}
                                  <Rect
                                    key={key}
                                    y={
                                      y +
                                      (nodeHeight * padding) +
                                      (seriesIndex * barHeight)
                                    }
                                    x={origin}
                                    height={barHeight}
                                    width={normalizedWidth}
                                    fill={color}
                                    stroke="white"
                                    strokeWidth={0.1}
                                    opacity={seriesIsNotHovered ? 0.1 : 1}
                                    cursor={edit ? 'pointer' : 'default'}
                                    onClick={(event) => {
                                      this.handleClickNode({
                                        seriesKey,
                                        valueKey: key,
                                        seriesIndex,
                                      }, event);
                                    }}
                                    onMouseEnter={(event) => {
                                      this.handleMouseEnterNode(
                                        nodes[valueIndex],
                                        { seriesKey, valueKey: key, seriesIndex },
                                        event
                                      );
                                    }}
                                    onMouseMove={(event) => {
                                      this.handleMouseEnterNode(
                                        nodes[valueIndex],
                                        { seriesKey, valueKey: key, seriesIndex },
                                        event
                                      );
                                    }}
                                    onMouseLeave={() => {
                                      this.handleMouseLeaveNode();
                                    }}
                                  />
                                  {this.renderValueLabel({
                                    key,
                                    barWidth: normalizedWidth,
                                    x: origin + (normalizedWidth / 2),
                                    y: y + (nodeHeight * padding) + (seriesIndex * barHeight),
                                    value: nodes[valueIndex],
                                    color,
                                    barHeight,
                                    node,
                                    seriesKey,
                                    seriesIndex,
                                  })}
                                </Group>
                              );
                            })}
                          </Group>
                        );
                      })}

                      {nodes.map((node, index) => {
                        const { nodeHeight, key } = node;

                        return (
                          <Group key={key}>
                            {this.renderLabel({
                              nodeCount: series.data.length,
                              index,
                              nodeHeight,
                              x: origin,
                              y: nodeHeight * index,
                              domain,
                              height: 100,
                              node,
                              labelsVisible,
                              maxChars: maxLabelChars,
                            })}
                          </Group>
                        );
                      })}

                    </Group>
                  )}</Grid>

                  <AxisBottom
                    scale={axisScale}
                    left={margins.left}
                    top={availableHeight + margins.top}
                    label={yAxisLabel || ''}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
                    numTicks={yAxisTicks}
                    labelProps={{
                      fontSize: axisLabelFontSize,
                      textAnchor: 'middle',
                    }}
                    tickFormat={tickFormat}
                  />

                  <Text
                    transform={[
                      {
                        type: 'translate',
                        value: [
                          margins.left,
                          margins.top - 10,
                        ],
                      },
                    ]}
                    {...labelFont}
                    fontSize={axisLabelFontSize}
                    fontWeight={400}
                  >
                    {abbr(xAxisLabel, maxLabelChars * labelSizeToAxisLabelSize)}
                  </Text>

                </Svg>
              </div>
            );
          }}</ResponsiveWrapper>
        }
      />
    );
  }

  renderStack() {
    const {
      width,
      height,
      colorMapping,
      onChangeVisualisationSpec,
      marginTop,
      marginRight,
      marginBottom,
      style,
      legendVisible,
      legendPosition,
      labelsVisible,
      legendTitle,
      edit,
      padding,
      yAxisLabel,
      yAxisTicks,
      xAxisLabel,
      grid,
      visualisation,
    } = this.props;

    const { tooltipItems, tooltipVisible, tooltipPosition, hasRendered } = this.state;

    const series = this.state.data;

    if (!series) return null;

    const marginLeft = this.getMarginLeft(series);
    const stackNodes = series.stack;
    const dataCount = series.data.length;
    const paddingBottom = getPaddingBottom(series.data);
    const axisLabelFontSize = getLabelFontSize(
      yAxisLabel,
      xAxisLabel,
      MAX_FONT_SIZE,
      MIN_FONT_SIZE,
      height,
      width
    );
    const maxLabelChars = Math.floor(marginLeft / LABEL_CHAR_WIDTH);
    const labelSizeToAxisLabelSize = Math.ceil(axisLabelFontSize / labelFont.fontSize);

    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible={legendVisible}
        legendPosition={legendPosition}
        onClick={() => {
          this.setState({ isPickingColor: undefined });
        }}
        legend={({ horizontal }) => (
          <Legend
            horizontal={!horizontal}
            title={legendTitle}
            data={stackNodes.map(({ key }) => replaceLabelIfValueEmpty(key))}
            colorMapping={
              stackNodes.reduce((acc, { key }, i) => ({
                ...acc,
                [replaceLabelIfValueEmpty(key)]: this.getColor(key, i),
              }), {})
            }
            // activeItem={get(this.state, 'hoveredNode.seriesKey')}
            onClick={({ datum }) => (event) => {
              this.handleClickNode(datum, event);
            }}
            onMouseEnter={({ datum }) => () => {
              if (this.state.isPickingColor) return;
              this.handleMouseEnterLegendNode(datum);
            }}
            onMouseLeave={() => () => {
              this.handleMouseLeaveLegendNode();
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

            const availableHeight =
              dimensions.height - margins.bottom - margins.top - paddingBottom;
            const availableWidth = dimensions.width - margins.left - margins.right;

            const domain = extent(series.data, ({ values }) =>
              Object.keys(values).reduce((acc, key) => acc + Math.abs(values[key]), 0)
            );

            if (domain[0] > 0) domain[0] = 0;

            const widthScale = scaleLinear()
              .domain([0, domain[1]])
              .range([0, availableWidth]);

            const origin = widthScale(0);

            const axisScale = scaleLinear()
              .domain([0, domain[1]])
              .range([0, availableWidth]);

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
                {hasRendered && visualisation && <RenderComplete id={visualisation.id} />}

                {tooltipVisible && (
                  <Tooltip
                    items={tooltipItems}
                    {...tooltipPosition}
                  />
                )}
                <Svg width={dimensions.width} height={dimensions.height}>

                  {grid && (
                    <GridColumns
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
                    cols={1}
                  >{nodes => (
                    <Group
                      transform={{
                        translate: [margins.left, margins.top],
                      }}
                    >
                      {stackNodes.map((stackSeries, seriesIndex) => {
                        const seriesKey = stackSeries.key;
                        const seriesIsNotHovered = (
                          this.state.hoveredSeries &&
                          this.state.hoveredSeries !== seriesKey
                        );

                        return (
                          <Group key={seriesKey}>
                            {stackSeries.map(([y0, y1], valueIndex) => {
                              const node = nodes[valueIndex];
                              const { nodeHeight, x, y, key } = nodes[valueIndex];
                              const color = this.getColor(seriesKey, seriesIndex);
                              const normalizedX = widthScale(y0);
                              const normalizedWidth = widthScale(y1) - normalizedX;
                              const colorpickerPlacement = valueIndex < dataCount / 2 ? 'right' : 'left';
                              const barHeight = (nodeHeight - (nodeHeight * padding * 2));

                              return (
                                <Group key={key}>
                                  {(
                                    get(this.state, 'isPickingColor') &&
                                    get(this.state, 'isPickingColor.valueKey') === key &&
                                    get(this.state, 'isPickingColor.seriesKey') === seriesKey
                                  ) && (
                                    <Portal node={this.wrap}>
                                      <ColorPicker
                                        title={`Pick color: ${key}`}
                                        color={color}
                                        left={
                                          colorpickerPlacement === 'right' ?
                                            margins.left + x + nodeHeight :
                                            margins.left + x
                                        }
                                        top={normalizedX}
                                        placement={colorpickerPlacement}
                                        onChange={({ hex }) => {
                                          onChangeVisualisationSpec({
                                            colors: {
                                              ...colorMapping,
                                              [this.state.isPickingColor.seriesKey]: hex,
                                            },
                                          });
                                          this.setState({ isPickingColor: undefined });
                                        }}
                                      />
                                    </Portal>
                                  )}
                                  <Rect
                                    key={key}
                                    y={y + (nodeHeight * padding)}
                                    x={normalizedX}
                                    height={barHeight}
                                    width={normalizedWidth}
                                    fill={color}
                                    stroke="white"
                                    strokeWidth={0.1}
                                    opacity={seriesIsNotHovered ? 0.1 : 1}
                                    cursor={edit ? 'pointer' : 'default'}
                                    onClick={(event) => {
                                      this.handleClickNode({
                                        seriesKey,
                                        valueKey: key,
                                        seriesIndex,
                                      }, event);
                                    }}
                                    onMouseEnter={(event) => {
                                      this.handleMouseEnterNode(
                                        nodes[valueIndex],
                                        { seriesKey, valueKey: key, seriesIndex },
                                        event
                                      );
                                    }}
                                    onMouseMove={(event) => {
                                      this.handleMouseEnterNode(
                                        nodes[valueIndex],
                                        { seriesKey, valueKey: key, seriesIndex },
                                        event
                                      );
                                    }}
                                    onMouseLeave={() => {
                                      this.handleMouseLeaveNode();
                                    }}
                                  />
                                  {this.renderValueLabel({
                                    key,
                                    barWidth: normalizedWidth,
                                    x: normalizedX + (normalizedWidth / 2),
                                    y: y + (nodeHeight * padding),
                                    value: nodes[valueIndex],
                                    color,
                                    barHeight,
                                    node,
                                    seriesKey,
                                    seriesIndex,
                                  })}
                                </Group>
                              );
                            })}
                          </Group>
                        );
                      })}

                      {nodes.map((node, index) => {
                        const { nodeHeight, key } = node;

                        return (
                          <Group key={key}>
                            {this.renderLabel({
                              nodeCount: series.data.length,
                              index,
                              nodeHeight,
                              x: origin,
                              y: nodeHeight * index,
                              domain,
                              height: 100,
                              node,
                              labelsVisible,
                              maxChars: maxLabelChars,
                            })}
                          </Group>
                        );
                      })}

                    </Group>
                  )}</Grid>

                  <AxisBottom
                    scale={axisScale}
                    left={margins.left}
                    top={availableHeight + margins.top}
                    label={yAxisLabel || ''}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
                    numTicks={yAxisTicks}
                    labelProps={{
                      fontSize: axisLabelFontSize,
                      textAnchor: 'middle',
                    }}
                    tickFormat={tickFormat}
                  />

                  <Text
                    transform={[
                      {
                        type: 'translate',
                        value: [
                          margins.left,
                          margins.top - 10,
                        ],
                      },
                    ]}
                    {...labelFont}
                    fontSize={axisLabelFontSize}
                    fontWeight={400}
                  >
                    {abbr(xAxisLabel, maxLabelChars * labelSizeToAxisLabelSize)}
                  </Text>

                </Svg>
              </div>
            );
          }}</ResponsiveWrapper>
        }
      />
    );
  }

  renderStackPercentage() {
    const {
      width,
      height,
      colorMapping,
      onChangeVisualisationSpec,
      marginTop,
      marginRight,
      marginBottom,
      style,
      legendVisible,
      legendPosition,
      labelsVisible,
      legendTitle,
      edit,
      padding,
      yAxisLabel,
      yAxisTicks,
      xAxisLabel,
      grid,
      visualisation,
    } = this.props;

    const { tooltipItems, tooltipVisible, tooltipPosition, hasRendered } = this.state;

    const series = this.state.data;

    if (!series) return null;

    const marginLeft = this.getMarginLeft(series);
    const stackNodes = series.stack;
    const dataCount = series.data.length;
    const paddingBottom = getPaddingBottom(series.data);
    const axisLabelFontSize = getLabelFontSize(
      yAxisLabel,
      xAxisLabel,
      MAX_FONT_SIZE,
      MIN_FONT_SIZE,
      height,
      width
    );
    const maxLabelChars = Math.floor(marginLeft / LABEL_CHAR_WIDTH);
    const labelSizeToAxisLabelSize = Math.ceil(axisLabelFontSize / labelFont.fontSize);

    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible={legendVisible}
        legendPosition={legendPosition}
        onClick={() => {
          this.setState({ isPickingColor: undefined });
        }}
        legend={({ horizontal }) => (
          <Legend
            horizontal={!horizontal}
            title={legendTitle}
            data={stackNodes.map(({ key }) => replaceLabelIfValueEmpty(key))}
            colorMapping={
              stackNodes.reduce((acc, { key }, i) => ({
                ...acc,
                [replaceLabelIfValueEmpty(key)]: this.getColor(key, i),
              }), {})
            }
            // activeItem={get(this.state, 'hoveredNode.seriesKey')}
            onClick={({ datum }) => (event) => {
              this.handleClickNode(datum, event);
            }}
            onMouseEnter={({ datum }) => () => {
              if (this.state.isPickingColor) return;
              this.handleMouseEnterLegendNode(datum);
            }}
            onMouseLeave={() => () => {
              this.handleMouseLeaveLegendNode();
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

            const availableHeight =
              dimensions.height - margins.bottom - margins.top - paddingBottom;
            const availableWidth = dimensions.width - margins.left - margins.right;

            const domain = extent(series.data, ({ values }) =>
              Object.keys(values).reduce((acc, key) => acc + Math.abs(values[key]), 0)
            );

            if (domain[0] > 0) domain[0] = 0;

            const widthScale = scaleLinear()
              .domain([0, domain[1]])
              .range([0, availableWidth]);

            const origin = widthScale(0);

            const axisScale = scaleLinear()
              .domain([0, 100])
              .range([0, availableWidth]);

            const tickFormat = value => `${value}%`;

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
                <Svg width={dimensions.width} height={dimensions.height}>

                  {grid && (
                    <GridColumns
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
                    cols={1}
                  >{nodes => (
                    <Group
                      transform={{
                        translate: [margins.left, margins.top],
                      }}
                    >
                      {stackNodes.map((stackSeries, seriesIndex) => {
                        const seriesKey = stackSeries.key;
                        const seriesIsNotHovered = (
                          this.state.hoveredSeries &&
                          this.state.hoveredSeries !== seriesKey
                        );

                        return (
                          <Group key={seriesKey}>
                            {stackSeries.map(([y0, y1], valueIndex) => {
                              const node = nodes[valueIndex];
                              const { nodeHeight, x, y, key } = node;
                              const color = this.getColor(seriesKey, seriesIndex);
                              const individualWidthScale = scaleLinear()
                                .range([0, availableWidth])
                                .domain([
                                  0,
                                  Object.keys(node.values).reduce((acc, subkey) =>
                                    acc + node.values[subkey]
                                  , 0),
                                ]);
                              const normalizedX = individualWidthScale(y0);
                              const normalizedWidth = individualWidthScale(y1) - normalizedX;
                              const colorpickerPlacement = valueIndex < dataCount / 2 ? 'right' : 'left';
                              const barHeight = (nodeHeight - (nodeHeight * padding * 2));

                              return (
                                <Group key={key}>
                                  {(
                                    get(this.state, 'isPickingColor') &&
                                    get(this.state, 'isPickingColor.valueKey') === key &&
                                    get(this.state, 'isPickingColor.seriesKey') === seriesKey
                                  ) && (
                                    <Portal node={this.wrap}>
                                      <ColorPicker
                                        title={`Pick color: ${key}`}
                                        color={color}
                                        left={
                                          colorpickerPlacement === 'right' ?
                                            margins.left + x + nodeHeight :
                                            margins.left + x
                                        }
                                        top={normalizedX}
                                        placement={colorpickerPlacement}
                                        onChange={({ hex }) => {
                                          onChangeVisualisationSpec({
                                            colors: {
                                              ...colorMapping,
                                              [this.state.isPickingColor.seriesKey]: hex,
                                            },
                                          });
                                          this.setState({ isPickingColor: undefined });
                                        }}
                                      />
                                    </Portal>
                                  )}
                                  <Rect
                                    key={key}
                                    y={y + (nodeHeight * padding)}
                                    x={normalizedX}
                                    height={barHeight}
                                    width={normalizedWidth}
                                    fill={color}
                                    stroke="white"
                                    strokeWidth={0.1}
                                    opacity={seriesIsNotHovered ? 0.1 : 1}
                                    cursor={edit ? 'pointer' : 'default'}
                                    onClick={(event) => {
                                      this.handleClickNode({
                                        seriesKey,
                                        valueKey: key,
                                        seriesIndex,
                                      }, event);
                                    }}
                                    onMouseEnter={(event) => {
                                      this.handleMouseEnterNode(
                                        nodes[valueIndex],
                                        { seriesKey, valueKey: key, seriesIndex },
                                        event
                                      );
                                    }}
                                    onMouseMove={(event) => {
                                      this.handleMouseEnterNode(
                                        nodes[valueIndex],
                                        { seriesKey, valueKey: key, seriesIndex },
                                        event
                                      );
                                    }}
                                    onMouseLeave={() => {
                                      this.handleMouseLeaveNode();
                                    }}
                                  />
                                  {this.renderValueLabel({
                                    key,
                                    barWidth: normalizedWidth,
                                    x: normalizedX + (normalizedWidth / 2),
                                    y: y + (nodeHeight * padding),
                                    value: nodes[valueIndex],
                                    color,
                                    barHeight,
                                    node,
                                    seriesKey,
                                    seriesIndex,
                                  })}
                                </Group>
                              );
                            })}
                          </Group>
                        );
                      })}

                      {nodes.map((node, index) => {
                        const { nodeHeight, key } = node;

                        return (
                          <Group key={key}>
                            {this.renderLabel({
                              nodeCount: series.data.length,
                              index,
                              nodeHeight,
                              x: origin,
                              y: nodeHeight * index,
                              domain,
                              height: 100,
                              node,
                              labelsVisible,
                              maxChars: maxLabelChars,
                            })}
                          </Group>
                        );
                      })}

                    </Group>
                  )}</Grid>

                  <AxisBottom
                    scale={axisScale}
                    left={margins.left}
                    top={availableHeight + margins.top}
                    label={yAxisLabel || ''}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
                    numTicks={yAxisTicks}
                    labelProps={{
                      fontSize: axisLabelFontSize,
                      textAnchor: 'middle',
                    }}
                    tickFormat={tickFormat}
                  />

                  <Text
                    transform={[
                      {
                        type: 'translate',
                        value: [
                          margins.left,
                          margins.top - 10,
                        ],
                      },
                    ]}
                    {...labelFont}
                    fontSize={axisLabelFontSize}
                    fontWeight={400}
                  >
                    {abbr(xAxisLabel, maxLabelChars * labelSizeToAxisLabelSize)}
                  </Text>

                </Svg>
              </div>
            );
          }}</ResponsiveWrapper>
        }
      />
    );
  }

  render() {
    const { subBucketMethod } = this.props;
    switch (subBucketMethod) {
      case 'split':
      default: {
        return this.renderSplit();
      }
      case 'stack': {
        return this.renderStack();
      }
      case 'stack_percentage': {
        return this.renderStackPercentage();
      }
    }
  }

}
