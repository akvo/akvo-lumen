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

import { heuristicRound, replaceLabelIfValueEmpty, calculateMargins, getLabelFontSize } from '../../utilities/chart';
import Legend from './Legend';
import ResponsiveWrapper from '../common/ResponsiveWrapper';
import ColorPicker from '../common/ColorPicker';
import ChartLayout from './ChartLayout';
import Tooltip from './Tooltip';
import { labelFont, MAX_FONT_SIZE, MIN_FONT_SIZE } from '../../constants/chart';
import RenderComplete from './RenderComplete';

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

export default class StackedBarChart extends Component {

  static propTypes = {
    data: PropTypes.shape({
      series: PropTypes.array,
      common: PropTypes.object,
      metadata: PropTypes.object,
    }),
    colors: PropTypes.array.isRequired,
    colorMapping: PropTypes.object,
    onChangeVisualisationSpec: PropTypes.func,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    legendPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left', undefined]),
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
    labelsVisible: PropTypes.bool,
    legendTitle: PropTypes.string,
    yAxisLabel: PropTypes.string,
    xAxisLabel: PropTypes.string,
    subBucketMethod: PropTypes.string,
    grid: PropTypes.bool,
    yAxisTicks: PropTypes.number,
    visualisation: PropTypes.object,
  }

  static defaultProps = {
    interactive: true,
    marginLeft: 70,
    marginRight: 70,
    marginTop: 20,
    marginBottom: 60,
    legendVisible: true,
    labelsVisible: true,
    edit: false,
    padding: 0.1,
    colorMapping: {},
    grouped: false,
    grid: true,
  }

  static contextTypes = {
    abbrNumber: PropTypes.func,
  }

  constructor(props) {
    super(props);
    this.state = {
      isPickingColor: false,
      data: this.getData(props),
      hasRendered: false,
    };
  }

  componentDidMount() {
    this.setState({ hasRendered: true }); // eslint-disable-line
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ data: this.getData(nextProps) });
  }

  getData(props) { // eslint-disable-line
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

  renderLabel({ nodeHeight, x, y, node, index, nodeCount }) {
    if (
      (nodeCount >= 200 && index % 10 !== 0) ||
      (nodeCount < 200 && nodeCount > 40 && index % 5 !== 0)
    ) return null;
    let labelText = String(replaceLabelIfValueEmpty(node.key));
    labelText = labelText.length <= 16 ?
      labelText : `${labelText.substring(0, 13)}…`;

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

  renderSplit() {
    const {
      width,
      height,
      colorMapping,
      onChangeVisualisationSpec,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
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

    const stackNodes = series.stack;
    const dataCount = series.data.length;
    const seriesCount = this.props.data.series.length;
    const paddingBottom = getPaddingBottom(series.data);
    const axisLabelFontSize =
      getLabelFontSize(yAxisLabel, xAxisLabel, MAX_FONT_SIZE, MIN_FONT_SIZE, height, width);

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
              .range([0, availableWidth].reverse());

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
                                    stroke={color}
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

  renderStack() {
    const {
      width,
      height,
      colorMapping,
      onChangeVisualisationSpec,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
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

    const stackNodes = series.stack;
    const dataCount = series.data.length;
    const paddingBottom = getPaddingBottom(series.data);
    const axisLabelFontSize =
      getLabelFontSize(yAxisLabel, xAxisLabel, MAX_FONT_SIZE, MIN_FONT_SIZE, height, width);

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
                                    stroke={color}
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

  renderStackPercentage() {
    const {
      width,
      height,
      colorMapping,
      onChangeVisualisationSpec,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
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

    const stackNodes = series.stack;
    const dataCount = series.data.length;
    const paddingBottom = getPaddingBottom(series.data);
    const axisLabelFontSize =
      getLabelFontSize(yAxisLabel, xAxisLabel, MAX_FONT_SIZE, MIN_FONT_SIZE, height, width);

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
                                    stroke={color}
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
