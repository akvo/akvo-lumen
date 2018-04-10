import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Pie } from '@potion/layout'; // TODO: see if can optimize this
import { positionFromAngle } from '@nivo/core'; // TODO: move this to potion
import { Arc, Svg, Group, Text } from '@potion/element';
import get from 'lodash/get';
import { Portal } from 'react-portal';

import { sortAlphabetically } from '../../utilities/utils';
import { round } from '../../utilities/chart';
import Legend from './Legend';
import ResponsiveWrapper from '../ResponsiveWrapper';
import ColorPicker from '../ColorPicker';
import ChartLayout from './ChartLayout';
import Tooltip from './Tooltip';
import { labelFont } from '../../constants/chart';

const getDatum = (data, datum) => data.filter(({ bucketValue }) => bucketValue === datum)[0];

export default class PieChart extends Component {

  static propTypes = {
    data: PropTypes.shape({
      data: PropTypes.array,
      metadata: PropTypes.object,
    }),
    colors: PropTypes.object.isRequired,
    onChangeVisualisationSpec: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    innerRadius: PropTypes.number,
    legendPosition: PropTypes.oneOf(['right']),
    print: PropTypes.bool,
    interactive: PropTypes.bool,
    edit: PropTypes.bool,
    legendVisible: PropTypes.bool,
    style: PropTypes.object,
  }

  static defaultProps = {
    innerRadius: 0,
    interactive: true,
    legendVisible: true,
    edit: false,
  }

  state = {
    isPickingColor: false,
  }

  getData() {
    return this.props.data.data.sort((a, b) =>
      sortAlphabetically(a, b, ({ bucketValue }) => bucketValue)
    );
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

  handleMouseEnterNode({ bucketValue, bucketCount }, event) {
    const { interactive, print, colors } = this.props;
    if (!interactive || print) return;
    this.handleShowTooltip(event, {
      key: bucketValue,
      color: colors[bucketValue],
      value: bucketCount,
    });
    this.setState({ hoveredNode: bucketValue });
  }

  handleMouseEnterLegendNode({ bucketValue }) {
    if (this.state.isPickingColor) return;
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    this.setState({ hoveredNode: bucketValue });
  }

  handleMouseLeaveNode({ bucketValue }) {
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    if (this.state.hoveredNode === bucketValue) {
      this.setState({ hoveredNode: null, tooltipVisible: false });
    }
  }

  handleClickNode({ bucketValue }, event) {
    const { interactive, print, edit } = this.props;
    if (!interactive || print) return;
    event.stopPropagation();
    this.setState({
      isPickingColor: edit ? bucketValue : null,
      hoveredNode: bucketValue,
    });
  }

  renderLabel({ bucketValue, bucketCount, labelPosition, midAngle, totalCount }) {
    const { print, interactive, legendVisible } = this.props;
    return (print || !interactive) ? (
      <Text
        textAnchor={midAngle > Math.PI / 2 ? 'end' : 'start'}
        transform={{ translate: [labelPosition.x, labelPosition.y] }}
        {...labelFont}
      >
        {(!print && interactive && !legendVisible) && `${bucketValue}: `}
        {bucketCount}
        &nbsp;({round((bucketCount / totalCount) * 100, 2)}%)
      </Text>
    ) : null;
  }

  render() {
    const {
      width,
      height,
      colors,
      onChangeVisualisationSpec,
      innerRadius,
      style,
      legendVisible,
      edit,
    } = this.props;

    if (!get(this.props.data, 'data')) return null;

    const data = this.getData();
    const totalCount = data.reduce((total, datum) => total + datum.bucketCount, 0);
    const { tooltipItems, tooltipVisible, tooltipPosition } = this.state;

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
            data={data.map(({ bucketValue }) => bucketValue)}
            colors={colors}
            activeItem={get(this.state, 'hoveredNode')}
            onClick={({ datum }) => (event) => {
              this.handleClickNode({ ...getDatum(data, datum) }, event);
            }}
            onMouseEnter={({ datum }) => () => {
              this.handleMouseEnterLegendNode(getDatum(data, datum));
            }}
            onMouseLeave={({ datum }) => () => {
              if (this.state.isPickingColor) return;
              this.handleMouseLeaveNode(getDatum(data, datum));
            }}
          />
        )}
        chart={
          <ResponsiveWrapper>{(dimensions) => {
            const diameter = Math.min(dimensions.width, dimensions.height);

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
                  <Group transform={{ translate: [dimensions.width / 2, dimensions.height / 2] }}>
                    <Pie
                      data={data}
                      value={datum => datum.bucketCount}
                      id={datum => datum.bucketValue}
                      sort={() => 1}
                    >{nodes => (
                      <Group>
                        {nodes.map(({
                          startAngle,
                          endAngle,
                          data: { bucketValue, bucketCount },
                        }, i) => {
                          const midAngle = (((endAngle - startAngle) / 2) + startAngle) -
                            (Math.PI / 2);
                          const labelPosition = positionFromAngle(midAngle, diameter * 0.35);
                          const colorpickerPlacement = labelPosition.x < 0 ?
                            'right' :
                            'left';

                          return (
                            <Group>
                              {(this.state.isPickingColor === bucketValue) && (
                                <Portal node={this.wrap}>
                                  <ColorPicker
                                    left={dimensions.width / 2}
                                    top={dimensions.height / 2}
                                    placement={colorpickerPlacement}
                                    title={`Pick color: ${bucketValue}`}
                                    color={colors[this.state.isPickingColor]}
                                    onChange={({ hex }) => {
                                      onChangeVisualisationSpec({
                                        colors: { ...colors, [this.state.isPickingColor]: hex },
                                      });
                                      this.setState({ isPickingColor: null });
                                    }}
                                  />
                                </Portal>
                              )}
                              <Arc
                                key={i}
                                innerRadius={innerRadius}
                                outerRadius={diameter * (get(this.state, 'hoveredNode') === bucketValue ? 0.31 : 0.3)}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                fill={colors[bucketValue]}
                                stroke="white"
                                cursor={edit ? 'pointer' : 'default'}
                                onClick={(event) => {
                                  this.handleClickNode({ bucketValue }, event);
                                }}
                                onMouseEnter={(event) => {
                                  this.handleMouseEnterNode({ bucketValue, bucketCount }, event);
                                }}
                                onMouseMove={(event) => {
                                  this.handleMouseEnterNode({ bucketValue, bucketCount }, event);
                                }}
                                onMouseLeave={() => {
                                  this.handleMouseLeaveNode({ bucketValue });
                                }}
                              />
                              {this.renderLabel({
                                bucketValue,
                                bucketCount,
                                midAngle,
                                labelPosition,
                                totalCount,
                              })}
                            </Group>
                          );
                        })}
                      </Group>
                    )}</Pie>
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
