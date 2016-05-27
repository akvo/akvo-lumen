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
      return value == null ? null : moment(value).format();
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
      activeSidebar: null,
    };
    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleMenuToggleClick = this.handleMenuToggleClick.bind(this);
    this.handleMenuItemClick = this.handleMenuItemClick.bind(this);
    this.handleShowSidebar = this.handleShowSidebar.bind(this);
    this.handleHideSidebar = this.handleHideSidebar.bind(this);

    this.handleToggleColumnContextMenu = this.handleToggleColumnContextMenu.bind(this);
    this.handleToggleDataTypeContextMenu = this.handleToggleDataTypeContextMenu.bind(this);

    this.handleDataTypeContextMenuClicked = this.handleDataTypeContextMenuClicked.bind(this);
    this.handleColumnContextMenuClicked = this.handleColumnContextMenuClicked.bind(this);
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  getCellClassName(columnTitle) {
    if (this.state.activeSidebar &&
      this.state.activeSidebar.columnTitle === columnTitle) {
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

  handleMenuToggleClick(type, options) {
    /* FIXME: currently, the sidebar-hiding updates the DOM too slowly
    ** and any new context menu appears in an offset position.
    */
    this.handleHideSidebar();
    switch (type) {

      case 'columnMenu':
        if (this.state.activeColumnContextMenu &&
            options.columnTitle === this.state.activeColumnContextMenu.title) {
          // Close the menu
          this.setState({ activeColumnContextMenu: null });
        } else {
          this.setState({
            activeColumnContextMenu: {
              title: options.columnTitle,
              left: options.left,
              top: options.top,
              width: options.width,
            },
            activeDataTypeContextMenu: null,
          });
        }
        break;

      case 'logMenu':
        if (this.state.activeSidebar &&
          this.state.activeSidebar.type === 'transformationLog') {
          this.handleHideSidebar();
        } else {
          this.setState({
            activeDataTypeContextMenu: null,
            activeColumnContextMenu: null,
          });
          this.handleShowSidebar({
            type: 'transformationLog',
            displayRight: true,
          });
        }
        break;

      default:
        throw new Error(`Unknown menu type ${type} supplied to handleMenuToggleClick`);
    }
  }

  handleDataTypeContextMenuClicked({ column, newColumnType }) {
    this.setState({ activeDataTypeContextMenu: null });
    if (newColumnType !== column.type) {
      this.handleShowSidebar({
        type: 'edit',
        columnTitle: column.title,
        newColumnType,
      });
    }
  }

  handleColumnContextMenuClicked({ column, menuItem }) {
    this.setState({ activeColumnContextMenu: null });
    switch (menuItem) {
      case 'filter':
        this.handleShowSidebar({
          type: 'filter',
          columnTitle: column.title,
        });
        break;

      default:
        throw new Error(`Menu item ${menuItem} not yet implemented`);
    }
  }

  handleMenuItemClick(type) {
    switch (type) {
      default:
        throw new Error(`Unknown item type ${type} supplied to handleMenuItemClick`);
    }
  }

  handleShowSidebar(sidebar) {
    /* Manually subtract the sidebar width from the datatable width -
    using refs to measure the new width of the parent container grabs
    old width before the DOM updates */
    this.setState({
      activeSidebar: sidebar,
      width: this.state.activeSidebar ? this.state.width : this.state.width - 300,
      height: this.state.height,
    });
  }

  handleHideSidebar() {
    if (this.state.activeSidebar) {
      this.setState({
        width: this.state.width + 300,
        height: this.state.height,
        activeSidebar: null,
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
    const { activeDataTypeContextMenu, activeColumnContextMenu } = this.state;

    const cols = this.props.columns.map((column, index) => {
      const columnHeader = (
        <ColumnHeader
          key={index}
          column={column}
          onToggleDataTypeContextMenu={this.handleToggleDataTypeContextMenu}
          onToggleColumnContextMenu={this.handleToggleColumnContextMenu}
          columnMenuActive={Boolean(this.state.activeColumnContextMenu
            && this.state.activeColumnContextMenu.title === column.title)}
        />
      );
      return (
        <Column
          cellClassName={this.getCellClassName(column.title)}
          key={index}
          header={columnHeader}
          cell={props => (
            <Cell>{formatCellValue(column.type, column.values[props.rowIndex])}</Cell>
          )}
          width={200}
        />
      );
    });

    return (
      <div className="DatasetTable">
        <DatasetControls
          columns={this.props.columns}
          onClickMenuToggle={this.handleMenuToggleClick}
          onClickMenuItem={this.handleMenuItemClick}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: this.state.activeSidebar && this.state.activeSidebar.displayRight ?
              'row-reverse' : 'row',
          }}
        >
          {this.state.activeSidebar &&
            <DataTableSidebar
              {...this.state.activeSidebar}
              onClose={() => this.handleHideSidebar()}
            />}
          <div
            className="wrapper"
            ref="wrappingDiv"
            style={{
              width: this.state.activeSidebar ? 'calc(100% - 300px)' : '100%',
            }}
          >
            {activeDataTypeContextMenu != null &&
              <DataTypeContextMenu
                column={activeDataTypeContextMenu.column}
                dimensions={activeDataTypeContextMenu.dimensions}
                onContextMenuItemSelected={this.handleDataTypeContextMenuClicked}
              />}
            {this.state.activeColumnContextMenu &&
              <ColumnContextMenu
                column={activeColumnContextMenu.column}
                dimensions={activeColumnContextMenu.dimensions}
                onContextMenuItemSelected={this.handleColumnContextMenuClicked}
              />}
            <Table
              headerHeight={50}
              rowHeight={30}
              rowsCount={this.props.columns[0].values.length}
              width={this.state.width}
              height={this.state.height}
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
};
