import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Table, Column, Cell } from 'fixed-data-table-2';
import moment from 'moment';
import { withRouter } from 'react-router';
import ColumnHeader from './ColumnHeader';
import DataTableSidebar from './DataTableSidebar';
import DatasetControls from './DatasetControls';
import DataTypeContextMenu from './context-menus/DataTypeContextMenu';
import ColumnContextMenu from './context-menus/ColumnContextMenu';

require('./DatasetTable.scss');

function formatCellValue(type, value) {
  switch (type) {
    case 'date':
      return value == null ? null : moment(value).format();
    case 'geoshape':
      return '<geoshape>';
    default:
      return value;
  }
}

class DatasetTable extends Component {

  constructor() {
    super();
    this.state = {
      width: 1024,
      height: 800,
      activeDataTypeContextMenu: null,
      activeColumnContextMenu: null,
      sidebarProps: null,
    };

    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.showSidebar = this.showSidebar.bind(this);
    this.hideSidebar = this.hideSidebar.bind(this);

    this.handleToggleColumnContextMenu = this.handleToggleColumnContextMenu.bind(this);
    this.handleToggleDataTypeContextMenu = this.handleToggleDataTypeContextMenu.bind(this);

    this.handleDataTypeContextMenuClicked = this.handleDataTypeContextMenuClicked.bind(this);
    this.handleColumnContextMenuClicked = this.handleColumnContextMenuClicked.bind(this);

    this.dismissDataTypeContextMenu = this.dismissDataTypeContextMenu.bind(this);
    this.dismissColumnContextMenu = this.dismissColumnContextMenu.bind(this);

    this.handleToggleTransformationLog = this.handleToggleTransformationLog.bind(this);
    this.handleToggleCombineColumnSidebar = this.handleToggleCombineColumnSidebar.bind(this);
    this.handleToggleExtractMultipleColumnSidebar =
      this.handleToggleExtractMultipleColumnSidebar.bind(this);
    this.handleToggleSplitColumnSidebar =
      this.handleToggleSplitColumnSidebar.bind(this);
    this.handleToggleDeriveColumnSidebar = this.handleToggleDeriveColumnSidebar.bind(this);
    this.handleToggleGeoColumnSidebar = this.handleToggleGeoColumnSidebar.bind(this);
  }

  componentDidMount() {
    this.resizeTimeout = setTimeout(() => {
      this.handleResize();
    }, 500);
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    clearTimeout(this.resizeTimeout);
    window.removeEventListener('resize', this.handleResize);
  }

  getCellClassName(columnTitle) {
    const { sidebarProps } = this.state;
    if (sidebarProps != null &&
      sidebarProps.column &&
      sidebarProps.column.get('title') === columnTitle) {
      return 'sidebarTargetingColumn';
    }
    return '';
  }

  handleToggleDataTypeContextMenu({ column, dimensions }) {
    const { activeDataTypeContextMenu } = this.state;

    if (activeDataTypeContextMenu != null &&
      column.get('title') === activeDataTypeContextMenu.column.get('title')) {
      this.setState({ activeDataTypeContextMenu: null });
    } else {
      this.setState({
        activeDataTypeContextMenu: {
          column,
          dimensions,
        },
        activeColumnContextMenu: null,
      });
    }
  }

  handleToggleColumnContextMenu({ column, dimensions }) {
    const { activeColumnContextMenu } = this.state;
    if (activeColumnContextMenu != null &&
      column.get('title') === activeColumnContextMenu.column.get('title')) {
      this.setState({ activeColumnContextMenu: null });
    } else {
      this.setState({
        activeColumnContextMenu: {
          column,
          dimensions,
        },
        activeDataTypeContextMenu: null,
      });
    }
  }

  handleToggleTransformationLog() {
    if (this.state.sidebarProps &&
      this.state.sidebarProps.type === 'transformationLog') {
      this.hideSidebar();
    } else {
      this.setState({
        activeDataTypeContextMenu: null,
        activeColumnContextMenu: null,
      });
      this.showSidebar({
        type: 'transformationLog',
        displayRight: true,
        onClose: this.hideSidebar,
        onUndo: this.props.onUndoTransformation,
        columns: this.props.columns,
      });
    }
  }

  handleToggleCombineColumnSidebar() {
    if (this.state.sidebarProps &&
      this.state.sidebarProps.type === 'combineColumns') {
      this.hideSidebar();
    } else {
      this.setState({
        activeDataTypeContextMenu: null,
        activeColumnContextMenu: null,
      });
      this.showSidebar({
        type: 'combineColumns',
        displayRight: false,
        onClose: this.hideSidebar,
        onApply: (transformation) => {
          this.props.onTransform(transformation).then(() => {
            this.hideSidebar();
          });
        },
        columns: this.props.columns,
      });
    }
  }

  handleToggleExtractMultipleColumnSidebar() {
    if (this.state.sidebarProps &&
      this.state.sidebarProps.type === 'extractMultiple') {
      this.hideSidebar();
    } else {
      this.setState({
        activeDataTypeContextMenu: null,
        activeColumnContextMenu: null,
      });
      this.showSidebar({
        type: 'extractMultiple',
        displayRight: false,
        onClose: this.hideSidebar,
        onApply: (transformation) => {
          this.props.onTransform(transformation).then(() => {
            this.hideSidebar();
          });
        },
        columns: this.props.columns,
      });
    }
  }

  handleToggleSplitColumnSidebar() {
    if (this.state.sidebarProps &&
      this.state.sidebarProps.type === 'splitColumn') {
      this.hideSidebar();
    } else {
      this.setState({
        activeDataTypeContextMenu: null,
        activeColumnContextMenu: null,
      });
      this.showSidebar({
        type: 'splitColumn',
        displayRight: false,
        onClose: this.hideSidebar,
        onApply: (transformation) => {
          this.props.onTransform(transformation).then(() => {
            this.hideSidebar();
          });
        },
        columns: this.props.columns,
      });
    }
  }

  handleToggleGeoColumnSidebar() {
    if (this.state.sidebarProps &&
      this.state.sidebarProps.type === 'generateGeopoints') {
      this.hideSidebar();
    } else {
      this.setState({
        activeDataTypeContextMenu: null,
        activeColumnContextMenu: null,
      });
      this.showSidebar({
        type: 'generateGeopoints',
        displayRight: false,
        onClose: this.hideSidebar,
        onApply: (transformation) => {
          this.props.onTransform(transformation).then(() => {
            this.hideSidebar();
          });
        },
        columns: this.props.columns,
      });
    }
  }

  handleToggleDeriveColumnSidebar() {
    if (this.state.sidebarProps &&
      this.state.sidebarProps.type === 'deriveColumn') {
      this.hideSidebar();
    } else {
      this.setState({
        activeDataTypeContextMenu: null,
        activeColumnContextMenu: null,
      });
      this.showSidebar({
        type: 'deriveColumn',
        displayRight: false,
        onClose: this.hideSidebar,
        onApply: (transformation) => {
          this.props.onTransform(transformation).then(() => {
            this.hideSidebar();
          });
        },
        columns: this.props.columns,
      });
    }
  }

  // Redirect to merge transform page
  handleMergeDataset() {
    const { location, router } = this.props;
    router.push(`${location.pathname}/transformation/merge`);
  }

  handleReverseGeocode() {
    const { location, router } = this.props;
    router.push(`${location.pathname}/transformation/reverse-geocode`);
  }

  handleDataTypeContextMenuClicked({ column, dataTypeOptions, newColumnType }) {
    this.setState({ activeDataTypeContextMenu: null });
    if (newColumnType !== column.get('type')) {
      this.showSidebar({
        type: 'edit',
        column,
        dataTypeOptions,
        newColumnType,
        onClose: this.hideSidebar,
        onApply: (transformation) => {
          this.hideSidebar();
          this.props.onTransform(transformation);
        },
      });
    }
  }

  handleColumnContextMenuClicked({ column, action }) {
    this.setState({ activeColumnContextMenu: null });
    switch (action.get('op')) {
      case 'core/filter-column':
        this.showSidebar({
          type: 'filter',
          column,
          onClose: () => this.hideSidebar(),
          onApply: (transformation) => {
            this.hideSidebar();
            this.props.onTransform(transformation);
          },
        });
        break;
      case 'core/rename-column':
        this.showSidebar({
          type: 'renameColumn',
          column,
          onClose: () => this.hideSidebar(),
          onApply: (transformation) => {
            this.hideSidebar();
            this.props.onTransform(transformation);
          },
        });
        break;
      default:
        this.props.onTransform(action);
    }
  }

  showSidebar(sidebarProps) {
    /* Manually subtract the sidebar width from the datatable width -
    using refs to measure the new width of the parent container grabs
    old width before the DOM updates */
    this.setState({
      sidebarProps,
      width: this.state.sidebarProps ? this.state.width : this.state.width - 300,
      height: this.state.height,
    });
  }

  hideSidebar() {
    if (this.state.sidebarProps) {
      this.setState({
        width: this.state.width + 300,
        height: this.state.height,
        sidebarProps: null,
      });
    }
  }

  handleResize() {
    this.setState({
      width: this.wrappingDiv.clientWidth,
      height: this.wrappingDiv.clientHeight,
    });
  }

  handleScroll() {
    /* Close any active context menu when the datatable scrolls.
    Ideally, we would dynamically adjust the position of the context menu
    so this would not be necessary, but the dataTable component does
    not have an "onScroll" event, only onScrollEnd, which is too slow. */
    this.setState({
      activeDataTypeContextMenu: null,
      activeColumnContextMenu: null,
    });
  }

  dismissDataTypeContextMenu() {
    this.setState({ activeDataTypeContextMenu: null });
  }

  dismissColumnContextMenu() {
    this.setState({ activeColumnContextMenu: null });
  }

  render() {
    const {
      rows,
      columns,
      pendingTransformations,
      transformations,
      onNavigateToVisualise,
      datasetId,
      isLockedFromTransformations,
    } = this.props;

    const {
      activeDataTypeContextMenu,
      activeColumnContextMenu,
      sidebarProps,
      width,
      height,
    } = this.state;

    const cols = columns.map((column, index) => {
      const columnHeader = (
        <ColumnHeader
          key={index}
          column={column}
          onToggleDataTypeContextMenu={this.handleToggleDataTypeContextMenu}
          onToggleColumnContextMenu={this.handleToggleColumnContextMenu}
          columnMenuActive={activeColumnContextMenu != null &&
            activeColumnContextMenu.column.get('title') === column.get('title')}
          onRemoveSort={transformation => this.props.onTransform(transformation)}
        />
      );
      const formatCell = (props) => {
        const formattedCellValue =
          formatCellValue(column.get('type'), rows.getIn([props.rowIndex, index]));

        return (
          <Cell>
            <span
              title={formattedCellValue}
            >
              {formattedCellValue}
            </span>
          </Cell>
        );
      };

      return (
        <Column
          cellClassName={this.getCellClassName(column.get('title'))}
          key={index}
          header={columnHeader}
          cell={formatCell}
          width={200}
        />
      );
    });
    return (
      <div className="DatasetTable">
        <DatasetControls
          columns={columns}
          rowsCount={rows.size}
          onToggleTransformationLog={this.handleToggleTransformationLog}
          isLockedFromTransformations={isLockedFromTransformations}
          onNavigateToVisualise={onNavigateToVisualise}
          pendingTransformationsCount={pendingTransformations.size}
          onClickMenuItem={(menuItem) => {
            if (menuItem === 'combineColumns') {
              this.handleToggleCombineColumnSidebar();
            } else if (menuItem === 'extractMultiple') {
              this.handleToggleExtractMultipleColumnSidebar();
            } else if (menuItem === 'splitColumn') {
              this.handleToggleSplitColumnSidebar();
            } else if (menuItem === 'deriveColumn') {
              this.handleToggleDeriveColumnSidebar();
            } else if (menuItem === 'generateGeopoints') {
              this.handleToggleGeoColumnSidebar();
            } else if (menuItem === 'mergeDatasets') {
              this.handleMergeDataset();
            } else if (menuItem === 'reverseGeocode') {
              this.handleReverseGeocode();
            } else {
              throw new Error(`Not yet implemented: ${menuItem}`);
            }
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: sidebarProps && sidebarProps.displayRight ? 'row-reverse' : 'row',
          }}
        >
          <div className={`sidebarWrapper ${sidebarProps ? 'expanded' : 'collapsed'}`}>
            {sidebarProps &&
              <DataTableSidebar
                {...sidebarProps}
                transformations={transformations}
                isLockedFromTransformations={isLockedFromTransformations}
                datasetId={datasetId}
                pendingTransformations={pendingTransformations}
              />
            }
          </div>
          <div
            className={`wrapper ${sidebarProps ? 'hasSidebar' : 'noSidebar'}`}
            ref={(ref) => { this.wrappingDiv = ref; }}
          >
            {activeDataTypeContextMenu != null &&
              <DataTypeContextMenu
                column={activeDataTypeContextMenu.column}
                dimensions={activeDataTypeContextMenu.dimensions}
                onContextMenuItemSelected={this.handleDataTypeContextMenuClicked}
                onWindowClick={this.dismissDataTypeContextMenu}
              />}
            {activeColumnContextMenu && (
              <ColumnContextMenu
                column={activeColumnContextMenu.column}
                isLockedFromTransformations={isLockedFromTransformations}
                dimensions={activeColumnContextMenu.dimensions}
                onContextMenuItemSelected={this.handleColumnContextMenuClicked}
                onWindowClick={this.dismissColumnContextMenu}
                left={columns.last().get('title') === activeColumnContextMenu.column.get('title')}
              />
            )}
            <Table
              headerHeight={60}
              rowHeight={30}
              rowsCount={rows.size}
              width={width}
              height={height}
              onScrollStart={() => this.handleScroll()}
            >
              {cols}
            </Table>
          </div>
        </div>
      </div>
    );
  }
}

DatasetTable.propTypes = {
  datasetId: PropTypes.string.isRequired,
  columns: PropTypes.object.isRequired,
  rows: PropTypes.object.isRequired,
  transformations: PropTypes.object,
  pendingTransformations: PropTypes.object.isRequired,
  onTransform: PropTypes.func.isRequired,
  onUndoTransformation: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  onNavigateToVisualise: PropTypes.func.isRequired,
  isLockedFromTransformations: PropTypes.bool,
};

export default withRouter(DatasetTable);
