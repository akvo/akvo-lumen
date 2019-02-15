import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collection } from '@potion/layout'; // TODO: see if can optimize this
import { positionFromAngle } from '@nivo/core'; // TODO: move this to potion
import { Arc, Svg, Group, Text, Line } from '@potion/element';
import get from 'lodash/get';
import { Portal } from 'react-portal';
import merge from 'lodash/merge';
import itsSet from 'its-set';

import { round, replaceLabelIfValueEmpty } from '../../utilities/chart';
import Legend from './Legend';
import ResponsiveWrapper from '../common/ResponsiveWrapper';
import ColorPicker from '../common/ColorPicker';
import ChartLayout from './ChartLayout';
import Tooltip from './Tooltip';
import RenderComplete from './RenderComplete';
import { labelFont, connectionStyle } from '../../constants/chart';

const getDatum = (data, datum) => data.filter(({ key }) => key === datum)[0];

const getLabelText = (count, totalValuesSum) => `${count} (${round(100 * (count / totalValuesSum), 2)}%)`;

const sectorRadiusFromAreaAndAngle = (area, angle) => Math.sqrt(area / angle) * 2;

export default class PieChart extends Component {

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
    innerRadius: PropTypes.number,
    outerRadius: PropTypes.number,
    legendPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left', undefined]),
    legendTitle: PropTypes.string,
    print: PropTypes.bool,
    interactive: PropTypes.bool,
    edit: PropTypes.bool,
    legendVisible: PropTypes.bool,
    style: PropTypes.object,
    labelsVisible: PropTypes.bool,
    visualisation: PropTypes.object,
  }

  static defaultProps = {
    innerRadius: 0,
    outerRadius: 0.3,
    interactive: true,
    legendVisible: true,
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
          key: replaceLabelIfValueEmpty(datum.key),
          label: replaceLabelIfValueEmpty(datum.label),
        })),
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

  handleMouseEnterNode({ key, value, totalValuesSum }, event) {
    const { interactive, print, colorMapping } = this.props;
    if (!interactive || print) return;
    this.handleShowTooltip(event, {
      key,
      color: colorMapping[key],
      value: getLabelText(value, totalValuesSum),
    });
    this.setState({ hoveredNode: key });
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
    labelPosition,
    edgePosition,
    midAngle,
    totalValuesSum,
    angle,
    nextNode,
  }) {
    const { print, interactive, legendVisible, labelsVisible } = this.props;
    const offset = (input, mult) => Math.floor(input * mult);
    const labelOffset = 0.95;
    const edgeOffset = 1.01;
    const showKey = Boolean(!legendVisible);
    const showLabel = Boolean(!interactive || print || labelsVisible);
    const nextNodeAngle = nextNode.endAngle - nextNode.startAngle;
    return (
      (print || !interactive || !legendVisible || labelsVisible) &&
      (angle > Math.PI / 12 || nextNodeAngle > Math.PI / 12)
    ) ? (
      <Group>
        <Text
          textAnchor={midAngle > Math.PI / 2 ? 'end' : 'start'}
          transform={{ translate: [labelPosition.x, labelPosition.y] }}
          {...labelFont}
        >
          {showKey && `${key}`}
          {(showKey && showLabel) && ': '}
          {showLabel && getLabelText(value, totalValuesSum)}
        </Text>
        <Line
          x1={offset(labelPosition.x, labelOffset)}
          y1={offset(labelPosition.y, labelOffset)}
          x2={offset(edgePosition.x, edgeOffset)}
          y2={offset(edgePosition.y, edgeOffset)}
          {...connectionStyle}
        />
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
      legendVisible,
      edit,
      outerRadius,
      visualisation,
      labelsVisible,
      legendPosition,
    } = this.props;

    const series = this.getData();

    if (!series) return null;

    let totalValuesSum = 0;
    let maxValue = -Infinity;
    series.data.forEach((datum) => {
      totalValuesSum += datum.value;
      maxValue = Math.max(datum.value, maxValue);
    });
    const nodeCount = series.data.length;
    const nodeAngle = (Math.PI * 2) / nodeCount;
    const radiusMultiplier = outerRadius / sectorRadiusFromAreaAndAngle(maxValue, nodeAngle);

    const { tooltipItems, tooltipVisible, tooltipPosition, hasRendered } = this.state;

    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible={legendVisible}
        legendPosition={legendPosition}
        onClick={() => {
          this.setState({ isPickingColor: undefined, hoveredNode: null });
        }}
        legend={({ horizontal }) => (
          <Legend
            horizontal={!horizontal}
            title={legendTitle}
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
            const diameter = Math.min(dimensions.width, dimensions.height) *
              (labelsVisible ? 0.8 : 1);

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
                  <Group transform={{ translate: [dimensions.width / 2, dimensions.height / 2] }}>
                    <Collection
                      data={series.data}
                    >{nodes => (
                      <Group>
                        {nodes.map(({ key, value }, i) => {
                          const color = this.getColor(key, i);
                          const startAngle = i * nodeAngle;
                          const endAngle = (i + 1) * nodeAngle;
                          const midAngle = (((endAngle - startAngle) / 2) + startAngle) -
                            (Math.PI / 2);
                          const radius = sectorRadiusFromAreaAndAngle(value, nodeAngle) *
                            radiusMultiplier;
                          const labelPosition = positionFromAngle(midAngle, diameter * 0.4);
                          const edgePosition = positionFromAngle(midAngle, diameter * radius);
                          const colorpickerPlacement = labelPosition.x < 0 ?
                            'right' :
                            'left';

                          return (
                            <Group key={key}>
                              {(this.state.isPickingColor === key) && (
                                <Portal node={this.wrap}>
                                  <ColorPicker
                                    left={dimensions.width / 2}
                                    top={dimensions.height / 2}
                                    placement={colorpickerPlacement}
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
                              <Arc
                                key={i}
                                innerRadius={0}
                                outerRadius={radius * diameter}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                fill={color}
                                stroke="white"
                                opacity={
                                  itsSet(this.state, 'hoveredNode') &&
                                  this.state.hoveredNode !== key ?
                                    0.3 :
                                    1
                                }
                                cursor={edit ? 'pointer' : 'default'}
                                onClick={(event) => {
                                  this.handleClickNode({ key }, event);
                                }}
                                onMouseEnter={(event) => {
                                  this.handleMouseEnterNode({ key, value, totalValuesSum }, event);
                                }}
                                onMouseMove={(event) => {
                                  this.handleMouseEnterNode({ key, value, totalValuesSum }, event);
                                }}
                                onMouseLeave={() => {
                                  this.handleMouseLeaveNode({ key });
                                }}
                              />
                              {this.renderLabel({
                                key,
                                value,
                                midAngle,
                                labelPosition,
                                edgePosition,
                                totalValuesSum,
                                angle: endAngle - startAngle,
                                nextNode: nodes[i + 1] || nodes[0],
                              })}
                            </Group>
                          );
                        })}
                      </Group>
                    )}</Collection>
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
