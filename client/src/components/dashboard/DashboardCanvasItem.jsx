import React, { Component } from 'react';
import PropTypes from 'prop-types';
import VisualisationViewer from '../charts/VisualisationViewer';
import DashboardCanvasItemEditable from './DashboardCanvasItemEditable';
import { getItemLayout, getIsDatasetLoaded } from '../../utilities/dashboard';

require('./DashboardCanvasItem.scss');

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
    const oldLayout = getItemLayout(this.props);
    const newLayout = getItemLayout(nextProps);
    const layoutsExist = Boolean(oldLayout && newLayout);
    const dimensionsChanged = layoutsExist ?
      oldLayout.w !== newLayout.w || oldLayout.h !== newLayout.h : true;
    const canvasWidthChanged = this.props.canvasWidth !== nextProps.canvasWidth;
    const needDataset = this.props.item.type === 'visualisation';
    const datasetDependencyMet = needDataset ? getIsDatasetLoaded(this.props) : true;
    const styleTransitionFinished = this.state.style.boxShadow === 'none';

    if (this.props.item.type === 'visualisation' &&
        !this.props.item.visualisation.data
        && nextProps.item.visualisation.data) {
      return true;
    }

    const shouldUpdate = Boolean(
        dimensionsChanged ||
        canvasWidthChanged ||
        !datasetDependencyMet ||
        !styleTransitionFinished
      );

    return shouldUpdate;
  }

  getRenderDimensions() {
    const unit = this.props.canvasWidth / 12;
    const layout = getItemLayout(this.props);

    if (layout !== null) {
      return ({
        width: (layout.w * unit) - 40,
        height: (layout.h * unit) - 40,
      });
    }

    return null;
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
            {getIsDatasetLoaded(this.props) ?
              <VisualisationViewer
                visualisation={this.props.item.visualisation}
                datasets={this.props.datasets}
                width={dimensions.width}
                height={dimensions.height}
              /> : <div>Loading dataset...</div>
            }
          </div>
        }
        {this.props.item.type === 'text' &&
          <div
            className="itemContainer text"
            style={{
              height: dimensions.height,
              width: dimensions.width,
              fontSize: Math.floor(20 * (this.props.canvasWidth / 1280)),
              lineHeight: '1.5em',
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
          ✕
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
