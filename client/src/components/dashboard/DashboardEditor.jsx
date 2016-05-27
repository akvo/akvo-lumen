import React, { Component, PropTypes } from 'react';
import ReactGridLayout from 'react-grid-layout';
import DashChart from '../charts/DashChart';

require('../../styles/DashboardEditor.scss');
require('../../../node_modules/react-grid-layout/css/styles.css');
require('../../../node_modules/react-resizable/css/styles.css');

const getArrayFromObject = (object) => {
  const arr = [];

  Object.keys(object).forEach((key) => {
    let item = object[key];

    arr.push(item);
  })

  return arr;
}

export default class DashboardEditor extends Component {

  constructor() {
    super();
    this.state = {
      type: 'dashboard',
      name: 'Untitled dashboard',
      grid: [],
      entities: {},
      layout: [],
      gridWidth: 1024,
    };
    this.handleLayoutChange = this.handleLayoutChange.bind(this);
    this.handleVisualisationClick = this.handleVisualisationClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    // Offset the padding width (16px on each side)
    const newWidth = this.refs.DashboardEditorCanvasContainer.clientWidth - 32;
    if (newWidth !== this.state.gridWidth) {
      this.setState({
        gridWidth: newWidth,
      });
    }
  }

  handleLayoutChange(layout) {
    this.setState({layout: layout});
  }

  handleVisualisationClick(item) {
    let newEntities = this.state.entities;

    if (this.state.entities[item.id]) {
      delete newEntities[item.id];
      this.setState({
        entities: newEntities,
      });
    } else {
      newEntities[item.id] = item;

      let newLayout = this.state.layout;
      newLayout.push({
        w: 6,
        h: 6,
        x: 0,
        y: 0,
        i: item.id
      });

      this.setState({
        layout: newLayout,
      });
      this.setState({
        entities: newEntities,
      })
    }
  }

  render() {

    const canvasWidth = this.state.gridWidth;
    const rowHeight = canvasWidth / 12;

    return (
      <div className="DashboardEditor">
        <DashboardVisualisationList
          visualisations={getArrayFromObject(this.props.visualisations)}
          onVisualisationClick={this.handleVisualisationClick}
          dashboardItems={this.state.entities}
        />
        <div
          className="DashboardEditorCanvasContainer"
          ref="DashboardEditorCanvasContainer"
        >
          <div
            className="DashboardEditorCanvas"
            style={{
              position: 'relative',
              boxSizing: 'initial',
              padding: '16px',
            }}
          >
            <ReactGridLayout
              className="layout"
              cols={12}
              rowHeight={rowHeight}
              width={canvasWidth}
              verticalCompact={false}
              layout={this.state.layout}
              onLayoutChange={this.handleLayoutChange}
              /* Setting any margin results in grid units being different
              ** vertically and horizontally due to implementation details.
              ** Use a margin on the grid item themselves for now.
              */
              margin={[0,0]}
            >
              {getArrayFromObject(this.state.entities).map(item =>
                <div
                  key={item.id}
                >
                  <DashboardCanvasItem
                    item={item}
                    datasets={this.props.datasets}
                    canvasLayout={this.state.layout}
                    canvasWidth={canvasWidth}
                  />
                </div>
              )}
              </ReactGridLayout>
          </div>
        </div>
      </div>
    );
  }
}

function DashboardVisualisationList(props) {
  return (
    <div className="DashboardVisualisationList">
      <ul>
        {props.visualisations.map(item =>
          <li
            key={item.id}
            style={{
              margin: '0.5rem 0',
            }}
          >
            {item.name}
            <span
              className="clickable"
              onClick={() => props.onVisualisationClick(item)}
              style={{
                padding: '0.5rem',
                fontSize: '1.25rem',
              }}
            >
              {props.dashboardItems[item.id] ? '[-]' : '[+]'}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

class DashboardCanvasItem extends Component {

  getItemLayout() {
    let output;

    this.props.canvasLayout.map((item, index) => {
      if (item.i === this.props.item.id) {
        output = this.props.canvasLayout[index];
      }
    });

    return output;
  }

  getRenderDimensions() {
    const unit = this.props.canvasWidth / 12;
    const layout = this.getItemLayout();

    return ({
      width: (layout.w * unit) - 40,
      height: (layout.h * unit) - 40,
    });
  }

  render() {
    const dimensions = this.getRenderDimensions();
    return (
      <div
        style={{
          padding: '10px',
          margin: '10px',
          backgroundColor: 'white',
          pointerEvents: 'none',
          border: '1px solid rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        <DashChart
          visualisation={this.props.item}
          datasets={this.props.datasets}
          width={dimensions.width}
          height={dimensions.height}
        />
      </div>
    );
  }
}

DashboardEditor.propTypes = {
  visualisations: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
