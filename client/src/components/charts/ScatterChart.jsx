import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collection } from '@potion/layout'; // TODO: see if can optimize this
import { Circle, Svg, Group } from '@potion/element';
import { AxisBottom, AxisLeft } from '@vx/axis';
import get from 'lodash/get';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { Portal } from 'react-portal';

import Legend from './Legend';
import ResponsiveWrapper from '../ResponsiveWrapper';
import ColorPicker from '../ColorPicker';
import Tooltip from './Tooltip';
import ChartLayout from './ChartLayout';

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
    // maxRadius: PropTypes.number,
    legendPosition: PropTypes.oneOf(['right']),
    print: PropTypes.bool,
    interactive: PropTypes.bool,
    edit: PropTypes.bool,
    marginLeft: PropTypes.number,
    marginRight: PropTypes.number,
    marginTop: PropTypes.number,
    marginBottom: PropTypes.number,
    opacity: PropTypes.number,
    style: PropTypes.object,
    legendVisible: PropTypes.bool,
  }

  static defaultProps = {
    marginLeft: 0.2,
    marginRight: 0.1,
    marginTop: 0.1,
    marginBottom: 0.2,
    opacity: 0.9,
    legendVisible: false,
    edit: false,
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

  handleShowTooltip(event, tooltipItems) {
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
      tooltipItems,
      tooltipPosition,
    });
  }

  handleMouseEnterNode({ key, x, y }, event) {
    const { interactive, print, colors } = this.props;
    if (!interactive || print) return;
    this.handleShowTooltip(event, [
      { key, color: colors[key] },
      { key: 'x', value: x },
      { key: 'y', value: y },
    ]);
    this.setState({ hoveredNode: key });
  }

  handleMouseEnterLegendNode({ key }) {
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
      isPickingColor: edit ? key : null,
      hoveredNode: key,
    });
  }

  render() {
    const {
      width,
      height,
      colors,
      onChangeVisualisationSpec,
      // maxRadius,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
      opacity,
      style,
      legendVisible,
    } = this.props;

    if (!get(this.props.data, 'data')) return null;

    const { tooltipItems, tooltipVisible, tooltipPosition } = this.state;
    const data = this.getData();
    // const dataCount = data.length;

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
            data={data.map(({ key }) => key)}
            colors={colors}
            activeItem={get(this.state, 'hoveredNode')}
            onClick={({ datum }) => (event) => {
              this.handleClickNode({ ...getDatum(data, datum) }, event);
            }}
            onMouseEnter={({ datum }) => () => {
              if (this.state.isPickingColor) return;
              this.handleMouseEnterLegendNode(getDatum(data, datum));
            }}
          />
        )}
        chart={
          <ResponsiveWrapper>{(dimensions) => {
            const xExtent = extent(data, ({ x }) => x);
            if (xExtent[0] > 0) xExtent[0] = 0;
            const xScale = scaleLinear()
              .domain(xExtent)
              .range([
                dimensions.width * marginLeft,
                dimensions.width * (1 - marginRight),
              ]);

            const yExtent = extent(data, ({ y }) => y);
            if (yExtent[0] > 0) yExtent[0] = 0;
            const yScale = scaleLinear()
              .domain(yExtent)
              .range([
                dimensions.height * (1 - marginBottom),
                dimensions.height * marginTop,
              ]);

            const radius = 5;

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
                  <Collection data={data}>{nodes => (
                    <Group>
                      {nodes.map(({ key, x, y, r, category }, i) => {
                        const normalizedX = xScale(x);
                        const normalizedY = yScale(y);
                        const colorpickerPlacementY = normalizedY < dimensions.height / 2 ? 'bottom' : 'top';
                        const colorpickerPlacementX = normalizedX < dimensions.width / 2 ? 'right' : 'left';
                        const colorpickerPlacement = `${colorpickerPlacementY}-${colorpickerPlacementX}`;

                        return (
                          <Group>
                            {(this.state.isPickingColor === key) && (
                              <Portal node={this.wrap}>
                                <ColorPicker
                                  left={normalizedX - 2}
                                  top={
                                    colorpickerPlacementY === 'top' ?
                                      normalizedY - radius :
                                      normalizedY + radius
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
                              r={radius}
                              fill={colors[key]}
                              stroke={colors[key]}
                              strokeWidth={2}
                              fillOpacity={opacity}
                              onClick={(event) => {
                                this.handleClickNode({ key }, event);
                              }}
                              onMouseEnter={(event) => {
                                this.handleMouseEnterNode({ key, x, y }, event);
                              }}
                              onMouseMove={(event) => {
                                this.handleMouseEnterNode({ key, x, y }, event);
                              }}
                              onMouseLeave={() => {
                                this.handleMouseLeaveNode();
                              }}
                            />
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
