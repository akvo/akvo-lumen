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
    }, 0);
  }

  shouldComponentUpdate(nextProps) {
    const oldLayout = this.getItemLayout(this.props);
    const newLayout = this.getItemLayout(nextProps);
    const layoutsExist = Boolean(oldLayout && newLayout);
    const dimensionsChanged = layoutsExist ?
      oldLayout.w !== newLayout.w || oldLayout.h !== newLayout.h : true;
    const canvasWidthChanged = this.props.canvasWidth !== nextProps.canvasWidth;
    const needDataset = this.props.item.type === 'visualisation';
    const datasetDependencyMet = needDataset ? this.getIsDatasetLoaded(this.props) : true;
    const styleTransitionFinished = this.state.style.boxShadow === 'none';

    const shouldUpdate = Boolean(
        dimensionsChanged ||
        canvasWidthChanged ||
        !datasetDependencyMet ||
        !styleTransitionFinished
      );

    return shouldUpdate;
  }

  getItemLayout(props) {
    let output = null;

    props.canvasLayout.forEach((item, index) => {
      if (item.i === props.item.id) {
        output = props.canvasLayout[index];
      }
    });

    return output;
  }

  getRenderDimensions() {
    const unit = this.props.canvasWidth / 12;
    const layout = this.getItemLayout(this.props);

    if (layout !== null) {
      return ({
        width: (layout.w * unit) - 40,
        height: (layout.h * unit) - 40,
      });
    }

    return null;
  }

  getIsDatasetLoaded(props) {
    return props.item.type === 'visualisation' &&
      props.datasets[props.item.visualisation.datasetId].get('columns');
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
            {this.getIsDatasetLoaded(this.props) ?
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
          className="clickable deleteButton noSelect"
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

