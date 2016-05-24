import React, { Component, PropTypes } from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import ColumnHeader from './ColumnHeader';
import ContextMenu from '../common/ContextMenu';
import DataTableSidebar from './DataTableSidebar';
import DatasetControls from './DatasetControls';

require('../../styles/DatasetTable.scss');

const columnTypeOptions = [
  {
    label: 'text',
    value: 'text',
  },
  {
    label: 'number',
    value: 'number',
  },
  {
    label: 'date',
    value: 'date',
  },
];

const columnMenuOptions = [
  {
    label: 'Filter',
    value: 'filter',
  },
  {
    label: 'Sort',
    value: 'sort',
    subMenu: [
      {
        label: 'Ascending',
        value: 'sort-ascending',
      },
      {
        label: 'Descending',
        value: 'sort-descending',
      },
    ],
  },
  {
    label: 'Whitespace',
    value: 'whitespace',
    subMenu: [
      {
        label: 'Remove leading and trailing whitespace',
        value: 'remove-leading-trailing-whitespace',
      },
      {
        label: 'Remove double spaces',
        value: 'remove-double-whitespace',
      },
    ],
  },
  {
    label: 'Change case',
    value: 'change-case',
    subMenu: [
      {
        label: 'To Uppercase',
        value: 'to-uppercase',
      },
      {
        label: 'To Lowercase',
        value: 'to-lowercase',
      },
      {
        label: 'To Titlecase',
        value: 'to-titlecase',
      },
    ],
  },
];

export default class DatasetTable extends Component {

  constructor() {
    super();
    this.state = {
      width: 1024,
      height: 800,
      activeTransformationMenu: null,
      activeColumnMenu: null,
      activeSidebar: null,
    };
    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleMenuToggleClick = this.handleMenuToggleClick.bind(this);
    this.handleMenuItemClick = this.handleMenuItemClick.bind(this);
    this.handleShowSidebar = this.handleShowSidebar.bind(this);
    this.handleHideSidebar = this.handleHideSidebar.bind(this);
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

  handleMenuToggleClick(type, options) {
    /* TOFIX: currently, the sidebar-hiding updates the DOM too slowly
    ** and any new context menu appears in an offset position.
    */
    this.handleHideSidebar();
    switch (type) {
      case 'transformContextMenu':
        if (this.state.activeTransformationMenu &&
            options.columnTitle === this.state.activeTransformationMenu.title) {
          // Close the menu
          this.setState({ activeTransformationMenu: null });
        } else {
          this.setState({
            activeTransformationMenu: {
              title: options.columnTitle,
              currentType: options.columnType,
              left: options.left,
              top: options.top,
            },
            activeColumnMenu: null,
          });
        }
        break;

      case 'columnMenu':
        if (this.state.activeColumnMenu &&
            options.columnTitle === this.state.activeColumnMenu.title) {
          // Close the menu
          this.setState({ activeColumnMenu: null });
        } else {
          this.setState({
            activeColumnMenu: {
              title: options.columnTitle,
              left: options.left,
              top: options.top,
              width: options.width,
            },
            activeTransformationMenu: null,
          });
        }
        break;

      case 'logMenu':
        if (this.state.activeSidebar &&
          this.state.activeSidebar.type === 'transformationLog') {
          this.handleHideSidebar();
        } else {
          this.setState({
            activeTransformationMenu: null,
            activeColumnMenu: null,
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

  handleMenuItemClick(type, item, oldItem) {
    switch (type) {
      case 'transformItem':
        if (item !== oldItem) {
          if (item === 'date') {
            this.handleShowSidebar({
              type: 'edit',
              columnTitle: this.state.activeTransformationMenu.title,
              oldColumnType: oldItem,
              newColunType: item,
            });
          }
        }
       // Close the context menu
        this.setState({ activeTransformationMenu: null });
        break;

      case 'columnItem':
        this.setState({
          activeColumnMenu: null,
        });
        switch (item) {
          case 'filter':
            this.handleShowSidebar({
              type: 'filter',
              columnTitle: this.state.activeColumnMenu.title,
            });
            break;

          default:
            throw new Error(`Unknown item ${item} supplied to handleMenuItemClick`);
        }
        break;
      case 'datasetEditorItem':
        console.log(item);
        break;

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
      activeTransformationMenu: null,
      activeColumnMenu: null,
    });
  }

  render() {
    const cols = this.props.columns.map((column, index) => {
      const columnHeader = (
        <ColumnHeader
          key={index}
          columnType={column.type}
          columnTitle={column.title}
          onClickMenuToggle={this.handleMenuToggleClick}
          columnMenuActive={Boolean(this.state.activeColumnMenu
            && this.state.activeColumnMenu.title === column.title)}
        >
          {column.title}
        </ColumnHeader>
      );
      return (
        <Column
          cellClassName={this.getCellClassName(column.title)}
          key={index}
          header={columnHeader}
          cell={props => (<Cell>{column.values[props.rowIndex]}</Cell>)}
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
              style={{
                width: '300px',
                height: 'calc(100vh - 4rem)',
              }}
              sidebar={this.state.activeSidebar}
              columnTitle={this.state.activeSidebar.columnTitle}
              newColumnType={this.state.activeSidebar.newColumnType}
              options={columnTypeOptions}
              onClose={() => this.handleHideSidebar()}
            />
          }
          <div
            className="wrapper"
            ref="wrappingDiv"
            style={{
              width: this.state.activeSidebar ? 'calc(100% - 300px)' : '100%',
            }}
          >
            {this.state.activeTransformationMenu &&
              <ContextMenu
                options={columnTypeOptions}
                selected={this.state.activeTransformationMenu.currentType}
                style={{
                  width: '8rem',
                  top: `${this.state.activeTransformationMenu.top}px`,
                  left: `${this.state.activeTransformationMenu.left}px`,
                  right: 'initial',
                }}
                onOptionSelected={(item, oldItem) =>
                  this.handleMenuItemClick('transformItem', item, oldItem)}
                arrowClass="topLeft"
                arrowOffset="15px"
              />
            }
            {this.state.activeColumnMenu &&
              <ContextMenu
                options={columnMenuOptions}
                selected={null}
                style={{
                  width: `${this.state.activeColumnMenu.width}px`,
                  top: `${this.state.activeColumnMenu.top}px`,
                  left: `${this.state.activeColumnMenu.left}px`,
                  right: 'initial',
                }}
                onOptionSelected={(item) => { this.handleMenuItemClick('columnItem', item); }}

              />
            }
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
