import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collection } from '@potion/layout'; // TODO: see if can optimize this
import { Circle, Svg, Group, Text, Rect } from '@potion/element';
import { AxisBottom, AxisLeft } from '@vx/axis';
import get from 'lodash/get';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { Portal } from 'react-portal';

import Legend from './Legend';
import ResponsiveWrapper from '../ResponsiveWrapper';
import ColorPicker from '../ColorPicker';
import ChartLayout from './ChartLayout';
import { labelFont } from '../../constants/chart';

const getDatum = (data, datum) => data.filter(({ key }) => key === datum)[0];

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
    colors: PropTypes.object.isRequired,
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
      if (a.r < b.r) return 1;
      if (a.r > b.r) return -1;
      return 0;
    });
  }

  handleMouseEnterNode({ key }) {
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    this.setState({ hoveredNode: key });
  }

  handleMouseLeaveNode({ key }) {}

  handleClickNode({ key, event }) {
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    event.stopPropagation();
    this.setState({
      isPickingColor: key,
      hoveredNode: key,
    });
  }

  renderLabel({ key, x, y, r, normalizedX, normalizedY, normalizedR }) {
    const { print, interactive } = this.props;
    return (print || !interactive || get(this.state, 'hoveredNode') === key) ? (
      <Group
        transform={{ translate: [normalizedX, normalizedY] }}
        onClick={(event) => {
          this.handleClickNode({ key, event });
        }}
      >
        <Rect
          x={-normalizedR}
          y={-10}
          width={normalizedR * 2}
          height={20}
          fill="white"
          opacity={0.3}
        />
        <Text
          textAnchor="middle"
          {...labelFont}
        >
          {r} [{x}, {y}]
        </Text>
      </Group>
    ) : null;
  }

  render() {
    const {
      width,
      height,
      colors,
      onChangeVisualisationSpec,
      minRadius,
      maxRadius,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
      opacity,
      style,
    } = this.props;

    if (!get(this.props.data, 'data')) return null;

    const data = this.getData();

    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible
        onClick={() => {
          this.setState({ isPickingColor: null });
        }}
        legend={({ horizontal }) => (
          <Legend
            horizontal={!horizontal}
            title={get(this.props, 'data.metadata.bucketColumnTitle')}
            data={data.map(({ key }) => key)}
            colors={colors}
            activeItem={get(this.state, 'hoveredNode')}
            onClick={({ datum }) => (event) => {
              this.handleClickNode({ ...getDatum(data, datum), event });
            }}
            onMouseEnter={({ datum }) => () => {
              if (this.state.isPickingColor) return;
              this.handleMouseEnterNode(getDatum(data, datum));
            }}
            onMouseLeave={({ datum }) => () => {
              if (this.state.isPickingColor) return;
              this.handleMouseLeaveNode(getDatum(data, datum));
            }}
          />
        )}
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

            const area = (dimensions.width * (1 - marginLeft - marginRight)) *
              (dimensions.height * (1 - marginTop - marginBottom));

            const rScale = scaleLinear()
              .domain(extent(data, ({ r }) => r))
              .range([
                minRadius || area * 0.00001,
                maxRadius || area * 0.0001,
              ]);

            return (
              <div
                style={{ position: 'relative' }}
                ref={(c) => {
                  this.wrap = c;
                }}
              >
                <Svg width={dimensions.width} height={dimensions.height}>
                  <Collection data={data}>{nodes => (
                    <Group>
                      {nodes.map(({ key, x, y, r, category }, i) => {
                        const normalizedX = xScale(x);
                        const normalizedY = yScale(y);
                        const normalizedR = rScale(r);
                        const colorpickerPlacementY = normalizedY < dimensions.height / 2 ? 'bottom' : 'top';
                        const colorpickerPlacementX = normalizedX < dimensions.width / 2 ? 'right' : 'left';
                        const colorpickerPlacement = `${colorpickerPlacementY}-${colorpickerPlacementX}`;

                        return (
                          <Group>
                            {(this.state.isPickingColor === key) && (
                              <Portal node={this.wrap}>
                                <ColorPicker
                                  left={normalizedX}
                                  top={
                                    colorpickerPlacementY === 'top' ?
                                      normalizedY - normalizedR :
                                      normalizedY + normalizedR
                                    }
                                  placement={colorpickerPlacement}
                                  title={`Pick color: ${key}`}
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
                            <Circle
                              key={i}
                              cx={normalizedX}
                              cy={normalizedY}
                              r={normalizedR}
                              fill={colors[key]}
                              stroke={colors[key]}
                              strokeWidth={2}
                              fillOpacity={opacity}
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
                              r,
                              normalizedX,
                              normalizedY,
                              normalizedR,
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
