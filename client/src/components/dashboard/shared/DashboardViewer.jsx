import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import windowSize from 'react-window-size';
import DashboardViewerItem from './DashboardViewerItem';
import FilterColumns from './../filter/FilterColumns';

require('./DashboardViewer.scss');

const viewportLimits = [
  {
    limit: 720,
    name: 'small',
  },
  {
    limit: 1024,
    name: 'medium',
  },
  {
    limit: Infinity,
    name: 'large',
  },
];

const TITLE_HEIGHT = 70;

const getArrayFromObject = object => Object.keys(object).map(key => object[key]);

const getSortFunc = layout => (a, b) => {
  const ay = layout[a.id].y;
  const by = layout[b.id].y;
  const ax = layout[a.id].x;
  const bx = layout[b.id].x;

  if (ay < by) {
    return -1;
  } else if (ay > by) {
    return 1;
  } else if (ax < bx) {
    return -1;
  } else if (ax > bx) {
    return 1;
  }
  return 0;
};

const getViewportType = (width) => {
  let viewport;
  for (let i = 0; i < viewportLimits.length; i += 1) {
    const entry = viewportLimits[i];

    if (width < entry.limit) {
      viewport = entry.name;
      break;
    }
  }
  return viewport;
};

class DashboardViewer extends Component {
  constructor() {
    super();
    this.getItemFromProps = this.getItemFromProps.bind(this);
  }

  getItemFromProps(item) {
    switch (item.type) {
      case 'text':
        return item;

      case 'visualisation': {
        const output = Object.assign({}, item);

        output.visualisation = this.props.visualisations[item.id];
        return output;
      }

      default:
        throw new Error(`Unknown item.type ${item.type} supplied to getItemFromProps()`);
    }
  }

  getBottomMostPoint() {
    return Object.keys(this.props.dashboard.layout).reduce((acc, key) => {
      const item = this.props.dashboard.layout[key];
      const itemBottom = item.y + item.h;
      return itemBottom > acc ? itemBottom : acc;
    }, 0);
  }

  render() {
    const { dashboard, datasets, metadata, windowWidth, filteredDashboard } = this.props;
    const layout = dashboard.layout;
    const viewportType = getViewportType(windowWidth);
    // eslint-disable-next-line no-console
    const onFilterChange = (filter, needToAggregate) => console.log('TODO:', filter, needToAggregate);
    const minHeight = viewportType === 'large' ?
      (this.getBottomMostPoint() * (windowWidth / 12)) + TITLE_HEIGHT + 100 :
      0;
    const sortFunc = getSortFunc(layout);
    const sortedDashboard = getArrayFromObject(dashboard.entities).sort(sortFunc);
    return (
      <div
        className="DashboardViewer"
        ref={(ref) => { this.DashboardViewer = ref; }}
        style={{ width: '100%', minHeight, height: 'auto' }}
      >
        <h1 className="DashboaredViewerTitle">{dashboard.title}</h1>
        {filteredDashboard &&
          <div style={{ marginLeft: '10px' }}><FilterColumns filter={dashboard.filter} dataset={datasets[dashboard.filter.datasetId]} onFilterChange={onFilterChange} /></div>
        }
        <div
          className="dashboardEntities"
          style={{
            position: 'relative',
          }}
        >
          {sortedDashboard.map(item =>
            <DashboardViewerItem
              key={item.id}
              item={this.getItemFromProps(item)}
              layout={layout[item.id]}
              canvasWidth={windowWidth}
              viewportType={viewportType}
              datasets={datasets}
              metadata={metadata}
            />
          )}
        </div>
      </div>
    );
  }
}

DashboardViewer.propTypes = {
  visualisations: PropTypes.object,
  datasets: PropTypes.object,
  metadata: PropTypes.object,
  windowWidth: PropTypes.number,
  filteredDashboard: PropTypes.bool,
  dashboard: PropTypes.shape({
    entities: PropTypes.object.isRequired,
    layout: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
  }),
};

export default connect(({ print }) => ({ print }))(windowSize(DashboardViewer));
