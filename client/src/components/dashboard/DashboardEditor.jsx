import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import ReactGridLayout from 'react-grid-layout';
import { Element, scroller } from 'react-scroll';
import { connect } from 'react-redux';

import DashboardVisualisationList from './DashboardVisualisationList';
import DashboardCanvasItem from './DashboardCanvasItem';
import { groupIntoPages } from '../../utilities/dashboard';
import { datasetsWithVisualizations } from '../../utilities/dataset';
import { A4 } from '../../constants/print';
import SelectMenu from '../common/SelectMenu';
import { fetchDataset } from '../../actions/dataset';

require('./DashboardEditor.scss');
require('../../../node_modules/react-grid-layout/css/styles.css');
require('../../../node_modules/react-resizable/css/styles.css');

export const ROW_COUNT = 16;
const COL_COUNT = 12;

const getArrayFromObject = object => Object.keys(object).map(key => object[key]);

const getNewEntityId = (entities, itemType) => {
  const entityArray = getArrayFromObject(entities);
  let highestIdInt = 0;

  entityArray.forEach((item) => {
    if (item.type === itemType) {
      const idInt = parseInt(item.id.substring(itemType.length + 1), 10);
      if (idInt > highestIdInt) highestIdInt = idInt;
    }
  });

  const newIdInt = highestIdInt + 1;

  return `${itemType}-${newIdInt}`;
};

const getFirstBlankRowGroup = (layout, height) => {
  /* Function to find the first collection of blank rows big enough for the
  /* default height of the entity about to be inserted. */

  /* If layout is empty, return the first row */
  if (layout.length === 0) return 0;

  const occupiedRows = {};
  let lastRow = 0;

  /* Build an object of all occupied rows, and record the last currently
  /* occupied row. */
  layout.forEach((item) => {
    for (let row = item.y; row < (item.y + item.h); row += 1) {
      occupiedRows[row] = true;
      if (row > lastRow) lastRow = row;
    }
  });

  /* Loop through every row from 0 to the last occupied. If we encounter a blank
  /* row i, check the next sequential rows until we have enough blank rows to
  /* fit our height. If we do, return row i. */
  for (let i = 0; i < lastRow; i += 1) {
    if (!occupiedRows[i]) {
      let haveSpace = true;

      for (let y = i + 1; y < (i + height); y += 1) {
        if (occupiedRows[y]) {
          haveSpace = false;
        }
      }

      if (haveSpace) {
        return i;
      }
    }
  }

  /* Otherwise, just return the row after the last currently occupied row. */
  return lastRow + 1;
};

const editorCanvasId = 'DashboardEditorCanvasContainer';
const getItemScrollName = id => `DashboardCanvasItem__${id}`;

const scrollToItem = (id) => {
  scroller.scrollTo(getItemScrollName(id), {
    duration: 500,
    smooth: true,
    containerId: editorCanvasId,
    offset: -60,
  });
};

class DashboardEditor extends Component {

  constructor() {
    super();
    this.state = {
      gridWidth: 1024,
      propLayout: [],
      saveError: false,
      focusedItem: null,
      isDragging: false,
      tabSelected: 'visualisations',
      filterByDataset: null,
      selectedFilterColumns: [],
    };
    this.canvasElements = {};
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

  getLayout() {
    const { exporting, preventPageOverlaps } = this.props;
    const { propLayout } = this.state;
    return (exporting && preventPageOverlaps) ?
      groupIntoPages()(propLayout) :
      propLayout;
  }

  getRowHeight() {
    const canvasWidth = this.state.gridWidth;
    const canvasHeight = (canvasWidth * (A4.height / A4.width)) + 46;
    const rowHeight = canvasHeight / ROW_COUNT;
    return rowHeight;
  }

  focusTextItem(id) {
    setTimeout(() => {
      const canvasItem = this.canvasElements[id];
      if (!canvasItem) return;
      const el = canvasItem.getElement();
      if (!el) return;
      const textarea = el.querySelector('textarea');
      if (!textarea) return;
      textarea.focus();
    }, 1000);
  }

  handleLayoutChange(layout) {
    this.props.onUpdateLayout(layout);
  }

  handleEntityToggle(item, itemType) {
    const newEntities = Object.assign({}, this.props.dashboard.entities);
    const newLayout = this.props.dashboard.layout.slice(0);
    const dashboardEntity = this.props.dashboard.entities[item.id];
    let newEntityId;

    if (dashboardEntity) {
      delete newEntities[item.id];
      this.setState({ focusedItem: null });
    } else if (itemType === 'visualisation') {
      newEntityId = item.id;
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
      newEntityId = getNewEntityId(this.props.dashboard.entities, itemType);

      newEntities[newEntityId] = {
        type: itemType,
        id: newEntityId,
        content: '',
      };
      newLayout.push({
        w: 12,
        minW: 4,
        h: 2,
        x: 0,
        y: getFirstBlankRowGroup(this.props.dashboard.layout, 1),
        i: newEntityId,
      });
    }

    /* Note that we update the propLayout, not the parent layout, to prevent race conditions. The
    /* parent layout will be updated automatically by handleLayoutChange */
    this.setState({ propLayout: newLayout }, () => {
      if (!dashboardEntity) {
        scrollToItem(newEntityId);
        if (itemType === 'text') {
          this.focusTextItem(newEntityId);
        }
      }
    });
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
    const { dashboard, datasets, exporting, filteredDashboard } = this.props;
    const canvasWidth = this.state.gridWidth;
    const rowHeight = this.getRowHeight();
    const layout = this.getLayout();
    const { tabSelected } = this.state;
    const selectTab = x => (tabSelected === x ? 'tabItem selected' : 'tabItem');
    const { filterByDataset, selectedFilterColumns } = this.state;
    const plusButton = i18nKey => (
      <button
        className="clickable addText"
        onClick={() => this.handleEntityToggle({ content: '' }, 'text')}
      >
        <i className="fa fa-plus" /><FormattedMessage id={i18nKey} />
      </button>);
    const visualisations = getArrayFromObject(this.props.visualisations);
    const datasetsWithViss = datasetsWithVisualizations(visualisations, datasets);
    const selectedDatasetColumns = filterByDataset && datasets[filterByDataset] && datasets[filterByDataset].get('columns');

    const newColumnFilterSelect = idx => (options, finder) =>
    (<div name="datasetFilterColumns" key={`div-selectFilterColumn-${idx}`}>
      <SelectMenu
        isClearable
        key={`selectFilterColumn-${idx}`}
        onChange={(columnName) => {
          if (columnName) {
            selectedFilterColumns.splice(idx, 1, columnName);
          } else {
            selectedFilterColumns.splice(idx, 1);
          }
          this.setState({ selectedFilterColumns });
        }}
        options={options}
        value={finder(selectedFilterColumns[idx])}
      />
    </div>);
    const columnFilterSelectOptions = selectedDatasetColumns && selectedDatasetColumns.map(c =>
      ({ value: c.get('columnName'), label: c.get('title') }));
    const finderFilterSelectOptions = v => columnFilterSelectOptions &&
    columnFilterSelectOptions.find(o => o.value === v);
    const dashboardEntitiesVisualisations = Object.values(dashboard.entities).filter(e => e.type === 'visualisation').map(e => this.props.visualisations[e.id]);
    return (
      <div
        className={`DashboardEditor ${exporting ? 'DashboardEditor--exporting' : ''}`}
      >
        {!exporting && (
          <div className="DashboardEditorSidebar">
            {!filteredDashboard && <div className="DashboardEditorCanvasControls">
              {plusButton('add_new_text_element')}
            </div>}
            {filteredDashboard && <div className="DashboardSidebarTabMenu">
              <div className={selectTab('visualisations')}>
                <button onClick={() => this.setState({ tabSelected: 'visualisations' })}>
                  <FormattedMessage id="visualisations" />
                </button>
              </div>
              <div className={selectTab('filters')}>
                <button onClick={() => this.setState({ tabSelected: 'filters' })}>
                  <FormattedMessage id="filters" />
                </button>
              </div>
              <div className="tabItem action">
                {plusButton('text')}
              </div>
            </div>}
            {(!filteredDashboard || tabSelected === 'visualisations') &&
              <DashboardVisualisationList
                datasets={datasets}
                visualisations={visualisations}
                onEntityClick={this.handleEntityToggle}
                dashboardItems={dashboard.entities}
              />}
            {tabSelected === 'filters' &&
            <div className="filtersTab">
              <FormattedMessage id="set_dataset_columns_as_visualisation_filters" />
              <br />
              <div className="filterInput">
                <label htmlFor="datasets">
                  <FormattedMessage id="dataset" />
                </label>
                <SelectMenu
                  name="datasets"
                  value={filterByDataset}
                  isClearable
                  onChange={(id) => {
                    this.setState({ filterByDataset: id, filterText: '', selectedFilterColumns: [] });
                    if (id) {
                      this.props.dispatch(fetchDataset(id, true));
                    }
                  }}
                  options={datasetsWithViss ? Object.keys(datasetsWithViss).map(d =>
                    ({ value: datasetsWithViss[d].get('id'), label: datasetsWithViss[d].get('name') })) : []}
                />
              </div>
              {selectedDatasetColumns && <div className="filterInput">
                <FormattedMessage id="filters" />
                - {dashboardEntitiesVisualisations.filter(v => v.datasetId === filterByDataset).length}/{dashboardEntitiesVisualisations.length} <FormattedMessage id="visualisations" />
                {
                  selectedFilterColumns.map((o, idx) =>
                  newColumnFilterSelect(idx)(columnFilterSelectOptions, finderFilterSelectOptions))
                }
                {newColumnFilterSelect(selectedFilterColumns.length)(columnFilterSelectOptions,
                  finderFilterSelectOptions)}
                </div>}
            </div>
            }
          </div>
        )}
        <div
          className={editorCanvasId}
          id={editorCanvasId}
          ref={(ref) => { this.DashboardEditorCanvasContainer = ref; }}
        >
          {filteredDashboard && <h3 style={{ padding: '10px', backgroundColor: 'pink' }}>filteredDashboard feature flag active!</h3>}
          {getArrayFromObject(dashboard.entities).length === 0 && !exporting &&
            <div className="blankDashboardHelpText">
              <FormattedMessage id="blank_dashboard_help_text" />
            </div>
          }
          <div className="DashboardEditorCanvas">
            <ReactGridLayout
              className="layout"
              cols={COL_COUNT}
              rowHeight={rowHeight}
              width={canvasWidth}
              verticalCompact={!exporting}
              layout={layout}
              onLayoutChange={this.handleLayoutChange}
              isDraggable={!this.state.focusedItem}
              isResizable={!this.state.focusedItem}

              /* Setting any margin results in grid units being different
              /* vertically and horizontally due to implementation details. Use
              /* a margin on the grid item themselves for now. */
              margin={[0, 0]}
            >
              {getArrayFromObject(dashboard.entities).reverse().map(item => (
                <div
                  key={item.id}
                  className={
                    this.state.focusedItem === item.id ?
                      'DashboardCanvasItemWrap--focused' :
                      ''
                  }
                >
                  <Element name={getItemScrollName(item.id)}>
                    <div />
                  </Element>
                  <DashboardCanvasItem
                    onFocus={() => {
                      this.setState({ focusedItem: item.id });
                    }}
                    focused={this.state.focusedItem === item.id}
                    item={this.getItemFromLibrary(item)}
                    datasets={this.props.datasets}
                    metadata={this.props.metadata}
                    canvasLayout={dashboard.layout}
                    canvasWidth={canvasWidth}
                    rowHeight={rowHeight}
                    onDeleteClick={this.handleEntityToggle}
                    onSave={this.props.onSave}
                    onEntityUpdate={this.handleEntityUpdate}
                    ref={(c) => { this.canvasElements[item.id] = c; }}
                    exporting={exporting}
                  />
                </div>
              ))}
            </ReactGridLayout>
            {this.state.focusedItem && !exporting && (
              <div
                className="DashboardEditorOverlay"
                onClick={() => {
                  this.setState({ focusedItem: null });
                }}
              />
            )}
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
  metadata: PropTypes.object,
  onUpdateLayout: PropTypes.func.isRequired,
  onUpdateEntities: PropTypes.func.isRequired,
  onUpdateName: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  exporting: PropTypes.bool,
  preventPageOverlaps: PropTypes.bool,
  filteredDashboard: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
};

DashboardEditor.defaultProps = {
  exporting: false,
  preventPageOverlaps: false,
};

export default connect(state => state)(DashboardEditor);
