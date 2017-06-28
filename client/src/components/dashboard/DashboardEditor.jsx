import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactGridLayout from 'react-grid-layout';
import DashboardVisualisationList from './DashboardVisualisationList';
import DashboardCanvasItem from './DashboardCanvasItem';
import { getNewEntityId, getFirstBlankRowGroup } from '../../utilities/dashboard';
import getArrayFromObject from '../../utilities/general';

require('./DashboardEditor.scss');
require('../../../node_modules/react-grid-layout/css/styles.css');
require('../../../node_modules/react-resizable/css/styles.css');

export default class DashboardEditor extends Component {

  constructor() {
    super();
    this.state = {
      gridWidth: 1024,
      propLayout: [],
      saveError: false,
    };
    this.handleLayoutChange = this.handleLayoutChange.bind(this);
    this.handleEntityToggle = this.handleEntityToggle.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleEntityUpdate = this.handleEntityUpdate.bind(this);
    this.handleChangeName = this.handleChangeName.bind(this);
    this.handleSave = this.handleSave.bind(this);
  }

  componentWillMount() {
    if (this.props.dashboard.layout) {
      this.setState({
        propLayout: this.props.dashboard.layout,
      });
    }
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.dashboard.layout.length > this.state.propLayout.length) {
      this.setState({ propLayout: nextProps.dashboard.layout });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  getItemFromLibrary(item) {
    switch (item.type) {
      case 'text':
        return item;

      case 'visualisation': {
        const output = Object.assign({}, item);
        output.visualisation = this.props.visualisations[item.id];
        return output;
      }

      default:
        throw new Error(`Unknown item.type ${item.type} supplied to getItemFromLibrary()`);
    }
  }

  handleLayoutChange(layout) {
    this.props.onUpdateLayout(layout);
  }

  handleEntityToggle(item, itemType) {
    const newEntities = Object.assign({}, this.props.dashboard.entities);
    const newLayout = this.props.dashboard.layout.slice(0);

    if (this.props.dashboard.entities[item.id]) {
      delete newEntities[item.id];
    } else if (itemType === 'visualisation') {
      this.props.onAddVisualisation(this.props.visualisations[item.id]);

      const visualisationType = this.props.visualisations[item.id].visualisationType;

      newEntities[item.id] = {
        type: itemType,
        id: item.id,
      };

      newLayout.push({
        w: 6,
        h: 6,
        minW: 4,
        minH: visualisationType === 'pivot table' ? 1 : 4,
        x: 0,
        y: getFirstBlankRowGroup(this.props.dashboard.layout, 4),
        i: item.id,
      });
    } else if (itemType === 'text') {
      const newEntityId = getNewEntityId(this.props.dashboard.entities, itemType);

      newEntities[newEntityId] = {
        type: itemType,
        id: newEntityId,
        content: '',
      };
      newLayout.push({
        w: 4,
        minW: 2,
        h: 1,
        x: 0,
        y: getFirstBlankRowGroup(this.props.dashboard.layout, 1),
        i: newEntityId,
      });
    }

    /* Note that we update the propLayout, not the parent layout, to prevent race conditions. The
    /* parent layout will be updated automatically by handleLayoutChange */
    this.setState({ propLayout: newLayout });
    this.props.onUpdateEntities(newEntities);
  }

  handleResize() {
    // Offset the padding width (16px on each side)
    const newWidth = this.DashboardEditorCanvasContainer.clientWidth - 32;
    if (newWidth !== this.state.gridWidth) {
      this.setState({
        gridWidth: newWidth,
      });
    }
  }

  handleEntityUpdate(entity) {
    const newEntities = Object.assign({}, this.props.dashboard.entities);

    newEntities[entity.id] = entity;
    this.props.onUpdateEntities(newEntities);
  }

  handleChangeName(e) {
    this.setState({ saveError: false });
    this.props.onUpdateName(e.target.value);
  }

  handleSave() {
    if (this.props.dashboard.title !== '') {
      this.props.onSave();
    } else {
      this.setState({ saveError: true });
    }
  }

  render() {
    const dashboard = this.props.dashboard;
    const canvasWidth = this.state.gridWidth;
    const rowHeight = canvasWidth / 12;

    return (
      <div className="DashboardEditor">
        <DashboardVisualisationList
          visualisations={getArrayFromObject(this.props.visualisations)}
          onEntityClick={this.handleEntityToggle}
          dashboardItems={dashboard.entities}
        />
        <div
          className="DashboardEditorCanvasContainer"
          ref={(ref) => { this.DashboardEditorCanvasContainer = ref; }}
        >
          <div className="DashboardEditorCanvasControls">
            <button
              className="clickable addText"
              onClick={() => this.handleEntityToggle({ content: '' }, 'text')}
            >
              Add new text element
            </button>
            <button
              className="clickable save"
              onClick={this.handleSave}
            >
              Save
            </button>
          </div>
          <div
            className={`DashboardNameInputContainer ${this.state.saveError ? 'error' : ''}`}
          >
            <input
              type="text"
              name="Dashboard name"
              value={dashboard.title}
              placeholder="Enter dashboard name"
              onChange={this.handleChangeName}
            />
          </div>
          {getArrayFromObject(dashboard.entities).length === 0 &&
            <div className="blankDashboardHelpText">
              Click a visualisation in the visualisation list to add it to the dashboard.
            </div>
          }
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
              layout={this.state.propLayout}
              onLayoutChange={this.handleLayoutChange}

              /* Setting any margin results in grid units being different
              /* vertically and horizontally due to implementation details. Use
              /* a margin on the grid item themselves for now. */
              margin={[0, 0]}
            >
              {getArrayFromObject(dashboard.entities).map(item =>
                <div
                  key={item.id}
                >
                  <DashboardCanvasItem
                    item={this.getItemFromLibrary(item)}
                    datasets={this.props.datasets}
                    canvasLayout={dashboard.layout}
                    canvasWidth={canvasWidth}
                    onDeleteClick={this.handleEntityToggle}
                    onEntityUpdate={this.handleEntityUpdate}
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

DashboardEditor.propTypes = {
  visualisations: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onAddVisualisation: PropTypes.func.isRequired,
  dashboard: PropTypes.shape({
    entities: PropTypes.object.isRequired,
    layout: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  onUpdateLayout: PropTypes.func.isRequired,
  onUpdateEntities: PropTypes.func.isRequired,
  onUpdateName: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};
