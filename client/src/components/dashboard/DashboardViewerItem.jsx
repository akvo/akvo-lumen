import React, { Component, PropTypes } from 'react';
import AsyncDashChart from '../charts/AsyncDashChart';

require('../../styles/DashboardViewerItem.scss');

const cMargin = 10; // margin between containers (in px)
const cPadding = 10; // padding inside container (in px)

export default class DashboardViewerItem extends Component {
  constructor() {
    super();

    this.getItemStyle = this.getItemStyle.bind(this);
  }
  getItemStyle() {
    const { item, layout, canvasWidth, viewportType } = this.props;
    const numCols = 12;
    const unit = canvasWidth / numCols;

    switch (viewportType) {
      case 'small':
        return {
          display: 'inline-block',
          width: canvasWidth - (cMargin * 2),
          height: item.type === 'visualisation' ?
            (canvasWidth * (layout.h / layout.w)) - (cMargin * 2) : 'initial',
          margin: cMargin,
          padding: cPadding,
        };

      case 'medium': {
        return {
          display: 'inline-block',
          width: (canvasWidth / 2) - (cMargin * 2),
          height: item.type === 'visualisation' ?
            ((canvasWidth * 0.5) * (layout.h / layout.w)) - (cMargin * 2) : 'initial',
          margin: cMargin,
          padding: cPadding,
        };
      }

      case 'large':
        return {
          position: 'absolute',
          width: (layout.w * unit) - (cMargin * 2),
          height: (layout.h * unit) - (cMargin * 2),
          left: layout.x * unit,
          top: layout.y * unit,
          margin: cMargin,
          padding: cPadding,
        };

      default:
        throw new Error(`Unknown viewportType ${viewportType} supplied to getItemStyle()`);
    }
  }

  render() {
    const style = this.getItemStyle();

    return (
      <div
        className="DashboardViewerItem DashboardCanvasItem"
        style={style}
      >
        {this.props.item.type === 'visualisation' &&
          <div
            className="itemContainer visualisation"
          >
            <AsyncDashChart
              visualisation={this.props.item.visualisation}
              datasets={this.props.datasets}
              width={style.width - (cPadding * 2)}
              height={style.height - (cPadding * 2)}
            />
          </div>
        }
        {this.props.item.type === 'text' &&
          <div
            className="itemContainer text"
          >
            {this.props.item.content}
          </div>
        }
      </div>
    );
  }
}

DashboardViewerItem.propTypes = {
  item: PropTypes.object.isRequired,
  layout: PropTypes.object.isRequired,
  canvasWidth: PropTypes.number.isRequired,
  viewportType: PropTypes.oneOf(['small', 'medium', 'large']),
  datasets: PropTypes.object,
};

