import React, { Component, PropTypes } from 'react';
import ReactGridLayout from 'react-grid-layout';

require('../../styles/DashboardEditor.scss');
require('../../../node_modules/react-grid-layout/css/styles.css');
require('../../../node_modules/react-resizable/css/styles.css');

export default class DashboardEditor extends Component{

  constructor() {
    super();
    this.state = {
      grid: [{id: 1, name: "hello"}],
      gridX: 0,
    }
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

    let gridX = 0;

    const onSpanClick = item => {
      var tmpArr = this.state.grid;
      var tmpInt = this.state.gridX;

      tmpArr.push(item);
      tmpInt++;

      this.setState({gridX: tmpInt})
      this.setState({grid: tmpArr});
    }

    return (
      <div className="DashboardEditor">
        I am a dashboard editor!
        <div className="VisualisationList">
          <ul>
            {getVisualisationArray().map(item =>
              <li key={item.id}>
                {item.name}
                <span
                  className="clickable"
                  onClick={() => onSpanClick(item)}
                >
                  [+]
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
            layout={[]}
            cols={12}
            rows={12}
            rowHeight={30}
            width={800}
            >
            {this.state.grid.map(item =>
              <div
                key={item.id}
                _grid={{
                  x: this.state.gridX,
                  y: Infinity,
                  w: 2,
                  h: 2,
                }}
              >
                {item.name}
              </div>
            )}
            </ReactGridLayout>
        </div>
      </div>
    );
  }
}

DashboardEditor.propTypes = {
  visualisations: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
