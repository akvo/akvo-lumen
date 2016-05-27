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

const getNewEntityId = (entities, itemType) => {
  const entityArray = getArrayFromObject(entities);
  let highestIdInt = 0;
  let newIdInt;

  entityArray.map(item => {
    if (item.type === itemType) {
      const idInt = parseInt(item.id.substring(itemType.length + 1));
      if (idInt > highestIdInt) highestIdInt = idInt;
    }
  });

  newIdInt = highestIdInt + 1;

  return `${itemType}-${newIdInt}`;
}

const getFirstBlankRowGroup = (layout, height) => {
  /* Function to find the first collection of blank rows big
  ** enough for the default height of the entity about to be
  ** inserted.
  */
  if (layout.length === 0) return 0;

  let firstBlankRow;
  let occupiedRows = {};
  let lastRow = 0;

  /* Build an object of all occupied rows, and record the
  ** last currently occupied row.
  */

  layout.map(item => {
    for (let row = item.y; row < (item.y + item.h); row++) {
      occupiedRows[row] = true;
      if (row > lastRow) lastRow = row;
    }
  });

  /* Loop through every row from 0 to the last occupied. If
  ** we encounter a blank row n, check the next sequential rows
  ** until we have enough blank row to fit our height. If we
  ** do, return row n.
  */

  for (let i = 0; i < lastRow; i++) {
    if (!occupiedRows[i]) {
      let haveSpace = true;

      for (let y = i + 1; y < (i + height); y++) {
        if (occupiedRows[y]) {
          haveSpace = false;
        }
      }

      if (haveSpace) {
        return i;
      }
    }
  }

  /* Otherwise, just return the row after the last currently
  ** occupied row.
  */
  return lastRow + 1;
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

  handleVisualisationClick(item, itemType) {
    let newEntities = this.state.entities;
    let newLayout = this.state.layout;

    if (this.state.entities[item.id]) {
      delete newEntities[item.id];
      this.setState({
        entities: newEntities,
      });
    } else {
      if (itemType === 'visualisation') {
        newEntities[item.id] = {
          type: itemType,
          id: item.id,
          visualisation: item,
        };

        newLayout.push({
          w: 6,
          h: 4,
          x: 0,
          y: getFirstBlankRowGroup(this.state.layout, 4),
          i: item.id
        });
      } else if (itemType === 'text') {
        const newEntityId = getNewEntityId(this.state.entities, itemType);

        newEntities[newEntityId] = {
          type: itemType,
          id: newEntityId,
          content: '',
        };
        newLayout.push({
          w: 4,
          h: 1,
          x: 0,
          y: getFirstBlankRowGroup(this.state.layout, 1),
          i: newEntityId,
        });
      }

      this.setState({
        layout: newLayout,
      });
      this.setState({
        entities: newEntities,
      });
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
                    onDeleteClick={this.handleVisualisationClick}
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
      <button
        onClick={() => props.onVisualisationClick({ content: '' }, 'text')}
      >
        Add new text entity
      </button>
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
              onClick={() => props.onVisualisationClick(item, 'visualisation')}
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
          border: '1px solid rgba(0,0,0,0.3)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
          {this.props.item.type === 'visualisation' &&
            <span
              style={{
                pointerEvents: 'none',
              }}
            >
              <DashChart
                visualisation={this.props.item.visualisation}
                datasets={this.props.datasets}
                width={dimensions.width}
                height={dimensions.height}
              />
            </span>
          }
          {this.props.item.type === 'text' &&
            <div
              style={{
                height: dimensions.height,
                width: dimensions.width,
                padding: '0.1rem',
              }}
            >
              Enter text here for {this.props.item.id}
            </div>
          }
        <button
          style={{
            position: 'absolute',
            top: '0px',
            right: '5px',
            display: 'block',
            fontWeight: 'bold',
            transform: 'rotate(45deg)',
            zIndex: '2',
            fontSize: '1.5rem',
          }}
          className="clickable deleteButton"
          onClick={() => this.props.onDeleteClick(this.props.item)}
        >
          +
        </button>
      </div>
    );
  }
}

DashboardEditor.propTypes = {
  visualisations: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
