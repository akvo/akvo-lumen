import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DashboardViewerItem from './DashboardViewerItem';
import { getArrayFromObject, getSortFunc, viewportLimits } from '../../utilities/dashboard';

require('./DashboardViewer.scss');

export default class DashboardViewer extends Component {
  constructor() {
    super();
    this.state = {
      canvasWidth: 1080,
      viewportType: 'large',
    };

    this.getItemFromProps = this.getItemFromProps.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
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

  handleResize() {
    const width = this.DashboardViewer.clientWidth;
    let viewport;

    for (let i = 0; i < viewportLimits.length; i += 1) {
      const entry = viewportLimits[i];

      if (width < entry.limit) {
        viewport = entry.name;
        break;
      }
    }

    this.setState({
      canvasWidth: width,
      viewportType: viewport,
    });
  }

  render() {
    const { dashboard, datasets } = this.props;
    const layout = dashboard.layout;
    const sortFunc = getSortFunc(layout);
    const sortedDashboard = getArrayFromObject(dashboard.entities).sort(sortFunc);

    return (
      <div
        className="DashboardViewer"
        ref={(ref) => { this.DashboardViewer = ref; }}
        style={{
          width: '100%',
        }}
      >
        <h1>{dashboard.title}</h1>
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
              canvasWidth={this.state.canvasWidth}
              viewportType={this.state.viewportType}
              datasets={datasets}
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
  dashboard: PropTypes.shape({
    entities: PropTypes.object.isRequired,
    layout: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
  }),
};
