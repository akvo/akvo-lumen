import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape } from 'react-intl';

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

// eslint-disable-next-line no-unused-vars
const DashboardCanvasItem = React.forwardRef((props, ref) => {
  const el = useRef(null);
  const titleEl = useRef(null);
  const getRenderDimensions = () => {
    const unit = props.canvasWidth / 12;
    const layout = getItemLayout(props);

    if (layout !== null) {
      return ({
        width: (layout.w * unit) - 60,
        height: (layout.h * props.rowHeight) - 60,
      });
    }

    return null;
  };

  const getSubTitle = () => {
    // eslint-disable-next-line react/prop-types
    const { item, datasets } = props;
    const lastUpdated = getDataLastUpdated({ datasets, visualisation: item.visualisation });
    return lastUpdated ? (
      <span>
        <FormattedMessage id="data_last_updated" />
        : {lastUpdated}
      </span>
    ) : null;
  };
  const dimensions = getRenderDimensions();

  if (dimensions === null) {
    // Layout has not been updated in parent yet
    return null;
  }

  const titleHeight = titleEl && titleEl.current ?
    titleEl.current.getBoundingClientRect().height :
    TITLE_HEIGHT;

  const { intl, item, filter, exporting, canvasLayout } = props;
  const { filterAffected } = item;
  let marginTop = 0;
  const dashFiltered = filter.columns.find(c => c.value);

  if (exporting) {
    const layoutItem = canvasLayout.filter(({ i }) => i === item.id)[0];
    marginTop = layoutItem.y >= ROW_COUNT ? -40 : 10;
  }

  return (
    <div
      data-test-id="dashboard-canvas-item"
      className="DashboardCanvasItem"
      ref={el}
      style={{ marginTop }}
    >
      {item.type === 'visualisation' && item.visualisation (
        <div className={`itemContainerWrap ${!exporting && !filterAffected && dashFiltered ? 'unFiltered' : ''}`}>
          <div
            className="itemTitle"
            ref={titleEl}
          >
            <span
              title={
                !exporting && !filterAffected && dashFiltered ?
                intl.messages.not_affected_by_applied_filters : null
              }
            >
              <h2>{getTitle(item.visualisation)}</h2>
              <div className="unfilteredMessage">
                {getSubTitle()}
                {exporting && !filterAffected && dashFiltered &&
                <span className="notAffected"> <FormattedMessage id="not_affected_by_applied_filters" /></span>}

              </div>
            </span>
          </div>
          <div className="noPointerEvents itemContainer visualisation">
            {getIsDatasetLoaded(props) ?
              <VisualisationViewer
                metadata={checkUndefined(props, 'metadata', item.visualisation.id)}
                visualisation={item.visualisation}
                datasets={props.datasets}
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
            fontSize: Math.floor(20 * (props.canvasWidth / 1280)),
            lineHeight: '1.5em',
          }}
        >
          <DashboardCanvasItemEditable
            onFocus={props.onFocus}
            focused={props.focused}
            onEntityUpdate={props.onEntityUpdate}
            item={item}
            onSave={props.onSave}
          />
        </div>
      )}
      <button
        className="clickable deleteButton noSelect"
        onClick={() => props.onDeleteClick(item)}
      >
        ✕
      </button>
    </div>
  );
});

DashboardCanvasItem.propTypes = {
  canvasLayout: PropTypes.array.isRequired,
  item: PropTypes.object.isRequired,
  canvasWidth: PropTypes.number.isRequired,
  rowHeight: PropTypes.number.isRequired,
  datasets: PropTypes.object.isRequired,
  metadata: PropTypes.object,
  filter: PropTypes.object,
  onEntityUpdate: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  focused: PropTypes.bool,
  onSave: PropTypes.func,
  exporting: PropTypes.bool,
  intl: intlShape,
};

export default DashboardCanvasItem;
