import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collection } from '@potion/layout'; // TODO: see if can optimize this
import { Circle, Svg, Group, Text, Rect, Area } from '@potion/element';
import { AxisBottom, AxisLeft } from '@vx/axis';
import get from 'lodash/get';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';

import ResponsiveWrapper from '../ResponsiveWrapper';
import ColorPicker from '../ColorPicker';
import ChartLayout from './ChartLayout';
import { labelFont } from '../../constants/chart';

export default class PieChart extends Component {

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
    onChangeVisualisationSpec: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    minRadius: PropTypes.number,
    maxRadius: PropTypes.number,
    legendPosition: PropTypes.oneOf(['right']),
    print: PropTypes.bool,
    interactive: PropTypes.bool,
    marginLeft: PropTypes.number,
    marginRight: PropTypes.number,
    marginTop: PropTypes.number,
    marginBottom: PropTypes.number,
    opacity: PropTypes.number,
    style: PropTypes.object,
  }

  static defaultProps = {
    marginLeft: 0.2,
    marginRight: 0.1,
    marginTop: 0.1,
    marginBottom: 0.2,
    opacity: 0.9,
  }

  state = {
    isPickingColor: false,
  }

  getData() {
    return this.props.data.data.sort((a, b) => {
      if (a.x < b.x) return 1;
      if (a.x > b.x) return -1;
      return 0;
    });
  }

  handleMouseEnterNode({ key }) {
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    this.setState({ hoveredNode: key });
  }

  handleMouseLeaveNode({ key }) {
    // const { interactive, print } = this.props;
    // if (!interactive || print) return;
    // if (this.state.hoveredNode === key) {
    //   this.setState({ hoveredNode: null });
    // }
  }

  handleClickNode({ key, event }) {
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    event.stopPropagation();
    this.setState({
      isPickingColor: true,
      hoveredNode: key,
    });
  }

  renderLabel({ key, x, y, normalizedX, normalizedY }) {
    const { print, interactive } = this.props;
    const labelLength = `[${x}, ${y}]`.length;
    return (print || !interactive || get(this.state, 'hoveredNode') === key) ? (
      <Group transform={{ translate: [normalizedX, normalizedY - 12] }}>
        <Rect
          x={-(labelLength * labelFont.fontSize) / 4}
          y={-10}
          width={(labelLength * labelFont.fontSize) / 2}
          height={20}
          fill="white"
          opacity={0.3}
        />
        <Text
          textAnchor="middle"
          {...labelFont}
        >
          [{x}, {y}]
        </Text>
      </Group>
    ) : null;
  }

  render() {
    const {
      width,
      height,
      color,
      onChangeVisualisationSpec,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
      style,
    } = this.props;
    if (!get(this.props.data, 'data')) return null;

    const data = this.getData();

    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible={false}
        onClick={() => {
          this.setState({ isPickingColor: null });
        }}
        chart={
          <ResponsiveWrapper>{(dimensions) => {
            const xScale = scaleLinear()
              .domain(extent(data, ({ x }) => x))
              .range([
                dimensions.width * marginLeft,
                dimensions.width * (1 - marginRight),
              ]);

            const yScale = scaleLinear()
              .domain(extent(data, ({ y }) => y))
              .range([
                dimensions.height * (1 - marginBottom),
                dimensions.height * marginTop,
              ]);

            const radius = Math.min((5 / data.length) * 20, 5);

            return (
              <div style={{ position: 'relative' }}>
                {this.state.isPickingColor && (
                  <ColorPicker
                    title="Pick color"
                    color={color}
                    onChange={({ hex }) => {
                      onChangeVisualisationSpec({ color: hex });
                      this.setState({ isPickingColor: null });
                    }}
                    left={dimensions.width / 2}
                    top={dimensions.height / 2}
                    style={{ transform: 'translateX(-50%) translateY(-50%)' }}
                    // placement={colorpickerPlacement}
                  />
                )}

                <Svg width={dimensions.width} height={dimensions.height}>

                  <Collection data={data}>{nodes => (
                    <Group>
                      <Area
                        points={data}
                        x={d => xScale(d.x)}
                        y1={d => yScale(d.y)}
                        y0={dimensions.height * (1 - marginBottom)}
                        fill={color}
                        fillOpacity={0.8}
                        onClick={(event) => {
                          this.handleClickNode({ key: null, event });
                        }}
                      />

                      {nodes.map(({ key, x, y }, i) => {
                        const normalizedX = xScale(x);
                        const normalizedY = yScale(y);
                        return (
                          <Group>
                            <Circle
                              key={i}
                              cx={normalizedX}
                              cy={normalizedY}
                              r={radius}
                              fill="white"
                              stroke={color}
                              strokeWidth={2}
                              onClick={(event) => {
                                this.handleClickNode({ key, event });
                              }}
                              onMouseEnter={() => {
                                if (this.state.isPickingColor) return;
                                this.handleMouseEnterNode({ key });
                              }}
                              onMouseLeave={() => {
                                if (this.state.isPickingColor) return;
                                this.handleMouseLeaveNode({ key });
                              }}
                            />
                            {this.renderLabel({
                              key,
                              x,
                              y,
                              normalizedX,
                              normalizedY,
                            })}
                          </Group>
                        );
                      })}
                    </Group>
                  )}</Collection>

                  <AxisLeft
                    scale={yScale}
                    left={dimensions.width * marginLeft}
                    label={'Y Axis'}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
                  />

                  <AxisBottom
                    scale={xScale}
                    top={dimensions.height * (1 - marginBottom)}
                    label={'X Axis'}
                    stroke={'#1b1a1e'}
                    tickTextFill={'#1b1a1e'}
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
