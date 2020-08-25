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
import itsSet from 'its-set';
import { barPropTypes, barDefaultProps } from './CommonBarChart';

import { isLight } from '../../../utilities/color';
import {
  heuristicRound,
  replaceLabelIfValueEmpty,
  calculateMargins,
  getLabelFontSize,
  labelFitsWidth,
} from '../../../utilities/chart';
import Legend from '../Legend';
import ResponsiveWrapper from '../../common/ResponsiveWrapper';
import ColorPicker from '../../common/ColorPicker';
import ChartLayout from '../ChartLayout';
import Tooltip from '../Tooltip';
import { labelFont, MAX_FONT_SIZE, MIN_FONT_SIZE } from '../../../constants/chart';
import RenderComplete from '../RenderComplete';
import { sortLegendListFunc, ensureSpecLegend, noSortFunc } from '../LegendsSortable';

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

export default class SimpleBarChart extends Component {

  static propTypes = barPropTypes;

  static defaultProps = barDefaultProps;

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

  renderLabel({ key, nodeWidth, x, y, domain, value, type, index, nodeCount }) {
    if (
      (nodeCount >= 200 && index % 10 !== 0) ||
      (nodeCount < 200 && nodeCount > 40 && index % 5 !== 0)
    ) return null;
    let labelText = String(getLabelText(key, type));
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

  renderValueLabel({ key, nodeWidth, x, y, value, color, height }) {
    const { valueLabelsVisible } = this.props;
    if (!valueLabelsVisible) return null;
    const labelText = heuristicRound(value);
    const labelX = x + (nodeWidth / 2);
    const OFFSET = 5;
    const labelY = value < 0 ? y - OFFSET : y + OFFSET;
    if (!labelFitsWidth(labelText, height)) return null;

    return (
      <Text
        textAnchor={value < 0 ? 'end' : 'start'}
        alignmentBaseline="center"
        transform={[
          { type: 'rotate', value: [90, labelX, labelY] },
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
      legendPosition,
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
    const dataCount = series.data.length;
    const axisLabelFontSize =
      getLabelFontSize(yAxisLabel, xAxisLabel, MAX_FONT_SIZE, MIN_FONT_SIZE, height, width);
    const specLegend = ensureSpecLegend(visualisation.spec.legend);
    const legendSeriesData = sortLegendListFunc(noSortFunc, specLegend)(series.data);

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
            title={get(this.props, 'data.metadata.bucketColumnTitle')}
            data={legendSeriesData.map(({ key }) => key)}
            colorMapping={
              legendSeriesData.reduce((acc, { key }, i) => ({
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
                {hasRendered && visualisation && <RenderComplete id={visualisation.id} />}

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
                    data={legendSeriesData}
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
                              nodeCount: series.data.length,
                              index: i,
                              key,
                              value,
                              nodeWidth,
                              x,
                              y: origin,
                              domain,
                            })}
                            {this.renderValueLabel({
                              key,
                              value,
                              nodeWidth,
                              x,
                              y: origin + ((value < 0 ? 1 : -1) * normalizedHeight),
                              color,
                              height: normalizedHeight,
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
                      fontSize: axisLabelFontSize,
                      textAnchor: 'middle',
                    }}
                    labelOffset={44}
                    tickFormat={tickFormat}
                  />

                  <Text
                    transform={[
                      { type: 'translate', value: [Math.floor(this.props.width / 2), this.props.height - 10] },
                    ]}
                    textAnchor="middle"
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
