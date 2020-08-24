import { Circle, Group, Svg, Text } from '@potion/element';
import { Pack } from '@potion/layout'; // TODO: see if can optimize this
import itsSet from 'its-set';
import get from 'lodash/get';
import merge from 'lodash/merge';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Portal } from 'react-portal';
import { randomColor } from '@potion/color';

import { labelFont } from '../../constants/chart';
import { calculateMargins, replaceLabelIfValueEmpty, round } from '../../utilities/chart';
import ColorPicker from '../common/ColorPicker';
import ResponsiveWrapper from '../common/ResponsiveWrapper';
import ChartLayout from './ChartLayout';
import Legend from './Legend';
import RenderComplete from './RenderComplete';
import Tooltip from './Tooltip';
import BubbleLegend from './BubbleLegend';
import { sortLegendsFunctionFactory, sortLegendListFunc, ensureSpecLegend } from './LegendsSortable';

const getDatum = (data, datum) => data.filter(({ key }) => key === datum)[0];

const getLabelText = (count, totalCount) => `${count} (${round(100 * (count / totalCount), 2)}%)`;

class BubbleChart extends Component {

  static propTypes = {
    data: PropTypes.shape({
      data: PropTypes.array,
      metadata: PropTypes.object,
    }),
    colors: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    colorMapping: PropTypes.object,
    onChangeVisualisationSpec: PropTypes.func,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    legendPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left', undefined]),
    legendTitle: PropTypes.string,
    legendDescription: PropTypes.string,
    print: PropTypes.bool,
    interactive: PropTypes.bool,
    edit: PropTypes.bool,
    legendVisible: PropTypes.bool,
    style: PropTypes.object,
    labelsVisible: PropTypes.bool,
    visualisation: PropTypes.object,
    marginLeft: PropTypes.number,
    marginRight: PropTypes.number,
    marginTop: PropTypes.number,
    marginBottom: PropTypes.number,
    env: PropTypes.object.isRequired,
  }

  static defaultProps = {
    interactive: true,
    legendVisible: true,
    legendPosition: 'right',
    marginLeft: 70,
    marginRight: 70,
    marginTop: 70,
    marginBottom: 70,
    edit: false,
    colorMapping: {},
    labelsVisible: false,
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

    const series = merge({}, data.common, data.series[0]);

    return {
      ...series,
      data: series.data
        .filter(itsSet)
        .map(datum => ({
          ...datum,
          value: Math.abs(datum.value),
          key: replaceLabelIfValueEmpty(datum.label),
          label: replaceLabelIfValueEmpty(datum.label),
        })),
    };
  }

  getColor(key, index) {
    const { colorMapping, colors } = this.props;
    this.colors[index] = this.colors[index] || randomColor();
    return colorMapping[key] || colors[index] || this.colors[index];
  }

  colors = {}

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

  handleMouseEnterNode({ key, value, totalCount, index }, event) {
    const { interactive, print, legendDescription } = this.props;
    if (!interactive || print) return;
    this.handleShowTooltip(event, [
      {
        key,
        color: this.getColor(key, index),
      },
      {
        key: legendDescription,
        value: getLabelText(value, totalCount),
      },
    ]);
  }

  handleMouseEnterLegendNode({ key }) {
    if (this.state.isPickingColor) return;
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    this.setState({ hoveredNode: key });
  }

  handleMouseLeaveNode({ key }) {
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    if (this.state.hoveredNode === key) {
      this.setState({ hoveredNode: null, tooltipVisible: false });
    }
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

  renderLabel({
    key,
    value,
    x,
    y,
    totalCount,
  }) {
    const { print, interactive, legendVisible, labelsVisible } = this.props;
    if (!labelsVisible && !print) return null;
    const showKey = Boolean(!legendVisible);
    const showLabel = Boolean(!interactive || print || labelsVisible);
    return (print || !interactive || !legendVisible || labelsVisible) ? (
      <Group>
        <Text
          textAnchor="middle"
          transform={{ translate: [x, y] }}
          {...labelFont}
          stroke="#ffffff"
          strokeWidth={2}
        >
          {showKey && `${key}`}
          {(showKey && showLabel) && ': '}
          {showLabel && getLabelText(value, totalCount)}
        </Text>
        <Text
          textAnchor="middle"
          transform={{ translate: [x, y] }}
          {...labelFont}
        >
          {showKey && `${key}`}
          {(showKey && showLabel) && ': '}
          {showLabel && getLabelText(value, totalCount)}
        </Text>
      </Group>
    ) : null;
  }

  render() {
    const {
      width,
      height,
      colorMapping,
      onChangeVisualisationSpec,
      style,
      legendTitle,
      legendDescription,
      legendVisible,
      legendPosition,
      edit,
      visualisation,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
    } = this.props;

    const series = this.getData();

    if (!series) return null;

    const totalCount = series.data.reduce((total, datum) => total + datum.value, 0);

    const { tooltipItems, tooltipVisible, tooltipPosition, hasRendered } = this.state;

    const sortFunctionFactory = sortLegendsFunctionFactory(visualisation);

    const specLegend = ensureSpecLegend(visualisation.spec.legend);
    const legendSeriesData = sortLegendListFunc(sortFunctionFactory,
      specLegend)(series.data.slice());

    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible={legendVisible}
        legendPosition={legendPosition}
        legendHeight={122}
        onClick={() => {
          this.setState({ isPickingColor: undefined, tooltipVisible: false });
        }}
        legend={({ horizontal }) => (
          <Legend
            horizontal={!horizontal}
            title={legendTitle}
            description={
              legendDescription && <BubbleLegend title={legendDescription} />
            }
            data={legendSeriesData.map(({ key }) => key)}
            colorMapping={
              legendSeriesData.reduce((acc, { key }, i) => ({
                ...acc,
                [key]: this.getColor(key, i),
              }), {})
            }
            activeItem={get(this.state, 'hoveredNode')}
            onClick={({ datum }) => (event) => {
              this.handleClickNode({ ...getDatum(series.data, datum) }, event);
            }}
            onMouseEnter={({ datum }) => () => {
              this.handleMouseEnterLegendNode(getDatum(series.data, datum));
            }}
            onMouseLeave={({ datum }) => () => {
              if (this.state.isPickingColor) return;
              this.handleMouseLeaveNode(getDatum(series.data, datum));
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
            const availableHeight = dimensions.height - margins.bottom - margins.top;
            const availableWidth = dimensions.width - margins.left - margins.right;

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
                  <Group transform={{ translate: [margins.left, margins.top] }}>
                    <Pack
                      data={{ children: legendSeriesData }}
                      sum={datum => datum.value}
                      size={[availableWidth, availableHeight]}
                      includeRoot={false}
                    >{nodes => (
                      <Group>
                        <Group>
                          {nodes.map(({
                            x,
                            y,
                            r,
                            data: { key, value },
                          }, i) => {
                            const color = this.getColor(key, i);

                            return (
                              <Group key={key}>
                                {(this.state.isPickingColor === key) && (
                                  <Portal node={this.wrap}>
                                    <ColorPicker
                                      left={dimensions.width / 2}
                                      top={dimensions.height / 3}
                                      placement="bottom"
                                      hideArrow
                                      title={`Pick color: ${key}`}
                                      color={color}
                                      onChange={({ hex }) => {
                                        onChangeVisualisationSpec({
                                          colors: {
                                            ...colorMapping,
                                            [this.state.isPickingColor]: hex,
                                          },
                                        });
                                        this.setState({ isPickingColor: null });
                                      }}
                                    />
                                  </Portal>
                                )}
                                <Circle
                                  key={i}
                                  r={r}
                                  cx={x}
                                  cy={y}
                                  opacity={
                                    itsSet(this.state, 'hoveredNode') &&
                                      get(this.state, 'hoveredNode') !== key ?
                                        0.2 :
                                        1
                                  }
                                  fill={color}
                                  stroke="white"
                                  cursor={edit ? 'pointer' : 'default'}
                                  onClick={(event) => {
                                    this.handleClickNode({ key }, event);
                                  }}
                                  onMouseEnter={(event) => {
                                    this.handleMouseEnterNode({
                                      key,
                                      value,
                                      totalCount,
                                      index: i,
                                    }, event);
                                  }}
                                  onMouseMove={(event) => {
                                    this.handleMouseEnterNode({
                                      key,
                                      value,
                                      totalCount,
                                      index: i,
                                    }, event);
                                  }}
                                  onMouseLeave={() => {
                                    this.handleMouseLeaveNode({ key });
                                  }}
                                />
                              </Group>
                            );
                          })}
                        </Group>

                        <Group>
                          {nodes.map(({
                            x,
                            y,
                            data: { key, value },
                          }) => (
                            <Group key={key}>
                              {this.renderLabel({
                                key,
                                value,
                                x,
                                y,
                                totalCount,
                              })}
                            </Group>
                          ))}
                        </Group>

                      </Group>
                    )}</Pack>
                  </Group>
                </Svg>
              </div>
            );
          }}</ResponsiveWrapper>
        }
      />
    );
  }

}

export default BubbleChart;
