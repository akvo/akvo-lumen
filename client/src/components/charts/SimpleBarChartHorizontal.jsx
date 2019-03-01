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
import { GridColumns } from '@vx/grid';
import itsSet from 'its-set';

import { isLight } from '../../utilities/color';
import { heuristicRound, replaceLabelIfValueEmpty, calculateMargins, getLabelFontSize } from '../../utilities/chart';
import Legend from './Legend';
import ResponsiveWrapper from '../common/ResponsiveWrapper';
import ColorPicker from '../common/ColorPicker';
import ChartLayout from './ChartLayout';
import Tooltip from './Tooltip';
import { labelFont, MAX_FONT_SIZE, MIN_FONT_SIZE } from '../../constants/chart';
import RenderComplete from './RenderComplete';

const getDatum = (data, datum) => data.filter(({ key }) => key === datum)[0];

const getLabelText = (label, type) => {
  const o = type === 'date' ?
    `${new Date(label * 1000)}` : replaceLabelIfValueEmpty(label);

  return o;
};

const getPaddingBottom = (data, type) => {
  const labelCutoffLength = 16;
  const longestLabel = data
    .map(({ label }) => String(getLabelText(label, type)))
    .sort((a, b) => b.length - a.length)[0];
  const longestLabelLength =
    Math.min(
      labelCutoffLength,
      longestLabel ? longestLabel.length : 0
    );
  const pixelsPerChar = 3.5;

  return Math.ceil(longestLabelLength * pixelsPerChar);
};

const LABEL_CHAR_WIDTH = 10;
const labelFitsBar = (text, height) => `${text}`.length * LABEL_CHAR_WIDTH < height;

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
    valueLabelsVisible: PropTypes.bool,
    yAxisLabel: PropTypes.string,
    yAxisTicks: PropTypes.number,
    xAxisLabel: PropTypes.string,
    grid: PropTypes.bool,
    visualisation: PropTypes.object,
  }

  static defaultProps = {
    interactive: true,
    marginLeft: 180,
    marginRight: 70,
    marginTop: 70,
    marginBottom: 70,
    legendVisible: false,
    valueLabelsVisible: false,
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
    hasRendered: false,
  }

  componentDidMount() {
    this.setState({ hasRendered: true }); // eslint-disable-line
  }

  getData() {
    const { data } = this.props;

    if (!itsSet(data, 'series[0]')) return false;

    const result = merge({}, data.common, data.series[0]);

    result.data = result.data.filter(itsSet);

    return result;
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
    const { interactive, print, colorMapping } = this.props;
    if (!interactive || print) return;
    this.handleShowTooltip(event, { key, color: colorMapping[key], value: heuristicRound(value) });
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

  renderLabel({ key, nodeHeight, x, y, value, type, index, nodeCount }) {
    if (
      (nodeCount >= 200 && index % 10 !== 0) ||
      (nodeCount < 200 && nodeCount > 40 && index % 5 !== 0)
    ) return null;
    let labelText = String(getLabelText(key, type));
    labelText = labelText.length <= 16 ?
      labelText : `${labelText.substring(0, 13)}…`;

    const labelY = y + (nodeHeight / 2);
    const labelX = x + (value >= 0 ? -10 : 10);
    return (
      <Text
        textAnchor={value >= 0 ? 'end' : 'start'}
        transform={[
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

  renderValueLabel({ key, nodeHeight, x, y, value, color, width }) {
    const { valueLabelsVisible } = this.props;
    if (!valueLabelsVisible) return null;
    const labelText = heuristicRound(value);
    const OFFSET = 5;
    if (!labelFitsBar(labelText, width)) return null;

    const labelY = y + (nodeHeight / 2);
    const labelX = x + (value >= 0 ? -OFFSET : OFFSET);
    return (
      <Text
        alignmentBaseline="center"
        textAnchor={value >= 0 ? 'end' : 'start'}
        transform={[
          { type: 'translate', value: [labelX, labelY] },
        ]}
        {...labelFont}
        fill={isLight(color) ? labelFont.fill : 'white'}
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
      visualisation,
    } = this.props;

    const { tooltipItems, tooltipVisible, tooltipPosition, hasRendered } = this.state;

    const series = this.getData();

    if (!series) return null;

    const dataType = series.metadata.type;
    const paddingBottom = getPaddingBottom(series.data, dataType);
    const axisLabelFontSize =
      getLabelFontSize(yAxisLabel, xAxisLabel, MAX_FONT_SIZE, MIN_FONT_SIZE, height, width);

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

            const domain = extent(series.data, ({ value }) => value);

            if (domain[0] > 0) domain[0] = 0;
            if (domain[0] < 0) margins.left = margins.right = 100;

            const availableHeight = dimensions.height - margins.bottom - margins.top - paddingBottom; // eslint-disable-line
            const availableWidth = dimensions.width - margins.left - margins.right;

            const widthScale = scaleLinear()
              .domain([0, domain[1] - domain[0]])
              .range([availableWidth, 0]);

            const origin = widthScale(Math.abs(domain[1]));

            const axisScale = scaleLinear().domain(domain).range([0, availableWidth]);

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
                      {nodes.map(({ nodeHeight, y, key, value }, nodeIndex) => {
                        const color = this.getColor(key, nodeIndex, nodes.length);
                        const normalizedWidth = availableWidth - widthScale(Math.abs(value));
                        const x = (value < 0) ? origin - normalizedWidth : origin;
                        return (
                          <Group key={key}>
                            {(this.state.isPickingColor === key) && (
                              <Portal node={this.wrap}>
                                <ColorPicker
                                  title={`Pick color: ${key}`}
                                  color={color}
                                  left={x + (normalizedWidth / 2) + margins.left}
                                  top={y + (nodeHeight * (nodeIndex < nodes.length / 2 ? 2 : 1))}
                                  placement={nodeIndex < nodes.length / 2 ? 'bottom' : 'top'}
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
                              y={y + (nodeHeight * padding)}
                              x={x}
                              height={nodeHeight - (nodeHeight * padding * 2)}
                              width={normalizedWidth}
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
                              nodeCount: series.data.length,
                              index: nodeIndex,
                              key,
                              value,
                              nodeHeight,
                              y,
                              domain,
                              margins,
                              x: origin,
                            })}
                            {this.renderValueLabel({
                              key,
                              value,
                              nodeHeight,
                              y,
                              color,
                              width: normalizedWidth,
                              x: value < 0 ? x : x + normalizedWidth,
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
                          domain[0] < 0 ? origin + margins.left : margins.left - 10,
                          margins.top - 10,
                        ],
                      },
                    ]}
                    textAnchor={domain[0] < 0 ? 'middle' : 'end'}
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

}
