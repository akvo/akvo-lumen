import React, { Component, PropTypes } from 'react';
import DashChart from '../charts/DashChart';
import DashboardCanvasItemEditable from './DashboardCanvasItemEditable';

require('../../styles/DashboardCanvasItem.scss');

export default class DashboardCanvasItem extends Component {

  constructor() {
    super();
    this.state = { style: null };
  }

  componentWillMount() {
    this.setState({
      style: {
        boxShadow: '0 0 30px 20px rgb(223, 244, 234)',
      },
    });

    setTimeout(() => {
      this.setState({
        style: {
          boxShadow: 'none',
          transition: 'box-shadow 1s ease-in-out',
        },
      });
    });
  }

  getItemLayout() {
    let output = null;

    this.props.canvasLayout.forEach((item, index) => {
      if (item.i === this.props.item.id) {
        output = this.props.canvasLayout[index];
      }
    });

    return output;
  }

  getRenderDimensions() {
    const unit = this.props.canvasWidth / 12;
    const layout = this.getItemLayout();

    if (layout !== null) {
      return ({
        width: (layout.w * unit) - 40,
        height: (layout.h * unit) - 40,
      });
    }

    return null;
  }

  getIsDatasetLoaded(item) {
    return item.type === 'visualisation' &&
      this.props.datasets[this.props.item.visualisation.datasetId].columns;
  }

  render() {
    const dimensions = this.getRenderDimensions();

    if (dimensions === null) {
      // Layout has not been updated in parent yet
      return null;
    }

    return (
      <div
        className="DashboardCanvasItem"
        style={this.state.style}
      >
        {this.props.item.type === 'visualisation' &&
          <div
            className="noPointerEvents itemContainer visualisation"
          >
            {this.getIsDatasetLoaded(this.props.item) ?
              <DashChart
                visualisation={this.props.item.visualisation}
                datasets={this.props.datasets}
                width={dimensions.width}
                height={dimensions.height}
              />
              :
              <div>Loading dataset...</div>
            }
          </div>
        }
        {this.props.item.type === 'text' &&
          <div
            className="itemContainer text"
            style={{
              height: dimensions.height,
              width: dimensions.width,
            }}
          >
            <DashboardCanvasItemEditable
              onEntityUpdate={this.props.onEntityUpdate}
              item={this.props.item}
            />
          </div>
        }
        <button
          className="clickable deleteButton"
          onClick={() => this.props.onDeleteClick(this.props.item)}
        >
          +
        </button>
      </div>
    );
  }
}

DashboardCanvasItem.propTypes = {
  canvasLayout: PropTypes.array.isRequired,
  item: PropTypes.object.isRequired,
  canvasWidth: PropTypes.number.isRequired,
  datasets: PropTypes.object.isRequired,
  onEntityUpdate: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
};

