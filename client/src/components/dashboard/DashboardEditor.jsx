import React, { Component, PropTypes } from 'react';
import ReactGridLayout from 'react-grid-layout';
import DashBarChart from '../charts/DashBarChart';

require('../../styles/DashboardEditor.scss');
require('../../../node_modules/react-grid-layout/css/styles.css');
require('../../../node_modules/react-resizable/css/styles.css');

export default class DashboardEditor extends Component {

  constructor() {
    super();
    this.state = {
      type: 'dashboard',
      name: 'Untitled dashboard',
      grid: [],
      entities: {},
      layout: [],
    };
    this.handleLayoutChange = this.handleLayoutChange.bind(this);
  }

  handleLayoutChange(layout) {
    this.setState({layout: layout});
  }

  render() {
    const getVisualisationArray = () => {
      var arr = [];

      Object.keys(this.props.visualisations).forEach((key) => {
        let item = this.props.visualisations[key];

        arr.push(item);
      })

      return arr;
    }

    const getArrayFromObject = (object) => {
      const arr = [];

      Object.keys(object).forEach((key) => {
        let item = object[key];

        arr.push(item);
      })

      return arr;
    }

    const onSpanClick = item => {
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

    const canvasWidth = 800;
    const rowHeight = canvasWidth / 12;

    return (
      <div className="DashboardEditor">
        I am a dashboard editor!
        <div className="VisualisationList">
          <ul>
            {getVisualisationArray().map(item =>
              <li
                key={item.id}
                style={{
                  margin: '0.5rem 0',
                }}
              >
                {item.name}
                <span
                  className="clickable"
                  onClick={() => onSpanClick(item)}
                  style={{
                    padding: '0.5rem',
                    fontSize: '1.25rem',
                  }}
                >
                  {this.state.entities[item.id] ? '[-]' : '[+]'}
                </span>
              </li>
            )}
          </ul>
        </div>
        <div
          className="DashboardEditorCanvas"
          style={{
            backgroundColor: 'whitesmoke',
            position: 'relative',
            minWidth: '800px',
          }}
        >
          <ReactGridLayout
            className="layout"
            cols={12}
            rows={12}
            rowHeight={67}
            width={800}
            layout={this.state.layout}
            onLayoutChange={this.handleLayoutChange}
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
    );
  }
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
      width: (layout.w * unit) - 10,
      height: (layout.h * unit) - 10,
    });
  }

  render() {
    const dimensions = this.getRenderDimensions();

    return (
      <div
        style={{
          padding: '10px',
        }}
      >
        <DashBarChart
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
