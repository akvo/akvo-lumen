import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import VisualisationViewer from '../charts/VisualisationViewer';
import DashboardCanvasItemEditable from './DashboardCanvasItemEditable';
import { checkUndefined } from '../../utilities/utils';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getTitle, getDataLastUpdated } from '../../utilities/chart';
import { ROW_COUNT } from './DashboardEditor';

require('./DashboardCanvasItem.scss');

const TITLE_HEIGHT = 60;

const getItemLayout = (props) => {
  let output = null;

  props.canvasLayout.some((item, index) => {
    let test = false;
    if (item.i === props.item.id) {
      output = props.canvasLayout[index];
      test = true;
    }
    return test;
  });

  return output;
};

const getIsDatasetLoaded = (props) => {
  if (props.item.type !== 'visualisation') {
    return false;
  }

  switch (props.item.visualisation.visualisationType) {
    case 'pivot table':
    case 'pie':
    case 'polararea':
    case 'donut':
    case 'line':
    case 'area':
    case 'bar':
    case 'scatter':
    case 'bubble':
      return true;

    case 'map':
      return Boolean(props.metadata && props.metadata[props.item.visualisation.id]);
    default:
      return Boolean(props.datasets[props.item.visualisation.datasetId].get('columns'));
  }
};

export default class DashboardCanvasItem extends Component {
  shouldComponentUpdate(nextProps) {
    const oldLayout = getItemLayout(this.props);
    const newLayout = getItemLayout(nextProps);
    const layoutsExist = Boolean(oldLayout && newLayout);
    const dimensionsChanged = layoutsExist ?
      oldLayout.w !== newLayout.w || oldLayout.h !== newLayout.h : true;
    const canvasWidthChanged = this.props.canvasWidth !== nextProps.canvasWidth;
    const needDataset = this.props.item.type === 'visualisation';
    const datasetDependencyMet = needDataset ? getIsDatasetLoaded(this.props) : true;

    if (this.props.item.type === 'visualisation' &&
        !this.props.item.visualisation.data
        && nextProps.item.visualisation.data) {
      return true;
    }

    const shouldUpdate = Boolean(
      dimensionsChanged ||
      canvasWidthChanged ||
      !datasetDependencyMet
    );

    return shouldUpdate;
  }

  getElement() {
    return this.el;
  }

  getRenderDimensions() {
    const unit = this.props.canvasWidth / 12;
    const layout = getItemLayout(this.props);

    if (layout !== null) {
      return ({
        width: (layout.w * unit) - 60,
        height: (layout.h * this.props.rowHeight) - 60,
      });
    }

    return null;
  }

  getSubTitle() {
    const { item, datasets } = this.props;
    const lastUpdated = getDataLastUpdated({ datasets, visualisation: item.visualisation });
    return lastUpdated ? (
      <span>
        <FormattedMessage id="data_last_updated" />
        : {lastUpdated}
      </span>
    ) : null;
  }

  render() {
    const dimensions = this.getRenderDimensions();

    if (dimensions === null) {
      // Layout has not been updated in parent yet
      return null;
    }

    const titleHeight = this.titleEl ?
      this.titleEl.getBoundingClientRect().height :
      TITLE_HEIGHT;

    const { item, exporting, canvasLayout } = this.props;
    const { unfiltered } = item;
    let marginTop = 0;

    if (exporting) {
      const layoutItem = canvasLayout.filter(({ i }) => i === item.id)[0];
      marginTop = layoutItem.y >= ROW_COUNT ? -40 : 10;
    }

    return (
      <div
        data-test-id="dashboard-canvas-item"
        className="DashboardCanvasItem"
        ref={(c) => { this.el = c; }}
        style={{ marginTop }}
      >
        {item.type === 'visualisation' && (
          <div className={`itemContainerWrap ${unfiltered ? 'unFiltered' : ''}`}>

            <div
              className="itemTitle"
              ref={(c) => {
                this.titleEl = c;
              }}
            >
              <h2>{getTitle(item.visualisation)}</h2>
              <span>{this.getSubTitle()}</span>
            </div>
            <div className="noPointerEvents itemContainer visualisation">
              {getIsDatasetLoaded(this.props) ?
                <VisualisationViewer
                  metadata={checkUndefined(this.props, 'metadata', item.visualisation.id)}
                  visualisation={item.visualisation}
                  datasets={this.props.datasets}
                  width={dimensions.width}
                  height={dimensions.height - titleHeight}
                  showTitle={false}
                  exporting={exporting}
                /> : <LoadingSpinner />
              }
            </div>
          </div>
        )}
        {item.type === 'text' && (
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
              onFocus={this.props.onFocus}
              focused={this.props.focused}
              onEntityUpdate={this.props.onEntityUpdate}
              item={item}
              onSave={this.props.onSave}
            />
          </div>
        )}
        <button
          className="clickable deleteButton noSelect"
          onClick={() => this.props.onDeleteClick(item)}
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
  rowHeight: PropTypes.number.isRequired,
  datasets: PropTypes.object.isRequired,
  metadata: PropTypes.object,
  onEntityUpdate: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  focused: PropTypes.bool,
  onSave: PropTypes.func,
  exporting: PropTypes.bool,
};
