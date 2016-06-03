import React, { Component, PropTypes } from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import moment from 'moment';
import ColumnHeader from './ColumnHeader';
import DataTableSidebar from './DataTableSidebar';
import DatasetControls from './DatasetControls';
import DataTypeContextMenu from './context-menus/DataTypeContextMenu';
import ColumnContextMenu from './context-menus/ColumnContextMenu';

require('../../styles/DatasetTable.scss');

function formatCellValue(type, value) {
  switch (type) {
    case 'date':
      return value == null ? null : moment.unix(value).format();
    default:
      return value;
  }
}

export default class DatasetTable extends Component {

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

    this.handleToggleTransformationLog = this.handleToggleTransformationLog.bind(this);
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  getCellClassName(columnTitle) {
    const { sidebarProps } = this.state;
    if (sidebarProps != null &&
      sidebarProps.column &&
      sidebarProps.column.title === columnTitle) {
      return 'sidebarTargetingColumn';
    }
    return '';
  }

  handleToggleDataTypeContextMenu({ column, dimensions }) {
    const { activeDataTypeContextMenu } = this.state;

    if (activeDataTypeContextMenu != null &&
      column.title === activeDataTypeContextMenu.column.title) {
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
    if (activeColumnContextMenu != null && column.title === activeColumnContextMenu.column.title) {
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

  handleDataTypeContextMenuClicked({ column, dataTypeOptions, newColumnType }) {
    this.setState({ activeDataTypeContextMenu: null });
    if (newColumnType !== column.type) {
      this.showSidebar({
        type: 'edit',
        column,
        dataTypeOptions,
        newColumnType,
        onClose: this.hideSidebar,
        onApply: transformation => {
          this.hideSidebar();
          this.props.onTransform(transformation);
        },
      });
    }
  }

  handleColumnContextMenuClicked({ column, action }) {
    this.setState({ activeColumnContextMenu: null });
    switch (action.op) {
      case 'core/filter':
        this.showSidebar({
          type: 'filter',
          column,
          onClose: () => this.hideSidebar(),
          onApply: transformation => {
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
      width: this.refs.wrappingDiv.clientWidth,
      height: this.refs.wrappingDiv.clientHeight,
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

  render() {
    const { rows, columns } = this.props;
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
            activeColumnContextMenu.column.title === column.title}
          onRemoveSort={(transformation) => this.props.onTransform(transformation)}
        />
      );
      return (
        <Column
          cellClassName={this.getCellClassName(column.title)}
          key={index}
          header={columnHeader}
          cell={props => <Cell>{formatCellValue(column.type, rows[props.rowIndex][index])}</Cell>}
          width={200}
        />
      );
    });

    return (
      <div className="DatasetTable">
        <DatasetControls
          columns={columns}
          rowsCount={rows.length}
          onToggleTransformationLog={this.handleToggleTransformationLog}
          onClickMenuItem={() => { throw new Error('Not yet implemented'); }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: sidebarProps && sidebarProps.displayRight ? 'row-reverse' : 'row',
          }}
        >
          {sidebarProps &&
            <DataTableSidebar
              {...sidebarProps}
              transformations={this.props.transformations}
            />}
          <div
            className="wrapper"
            ref="wrappingDiv"
            style={{
              width: sidebarProps ? 'calc(100% - 300px)' : '100%',
            }}
          >
            {activeDataTypeContextMenu != null &&
              <DataTypeContextMenu
                column={activeDataTypeContextMenu.column}
                dimensions={activeDataTypeContextMenu.dimensions}
                onContextMenuItemSelected={this.handleDataTypeContextMenuClicked}
              />}
            {activeColumnContextMenu &&
              <ColumnContextMenu
                column={activeColumnContextMenu.column}
                dimensions={activeColumnContextMenu.dimensions}
                onContextMenuItemSelected={this.handleColumnContextMenuClicked}
              />}
            <Table
              headerHeight={60}
              rowHeight={30}
              rowsCount={rows.length}
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
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  transformations: PropTypes.array,
  onTransform: PropTypes.func.isRequired,
  onUndoTransformation: PropTypes.func.isRequired,
};
