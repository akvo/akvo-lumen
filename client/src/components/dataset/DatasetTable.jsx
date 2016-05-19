import React, { Component, PropTypes } from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import ColumnHeader from './ColumnHeader';
import ContextMenu from '../common/ContextMenu';
import DataTableSidebar from './DataTableSidebar';

require('../../styles/DatasetTable.scss');

export default class DatasetTable extends Component {

  constructor() {
    super();
    this.state = {
      width: 1024,
      height: 800,
      activeTransformationMenu: null,
      activeColumnMenu: null,
      transformationSidebar: null,
    };
    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleClickTransformContextMenuToggle =
      this.handleClickTransformContextMenuToggle.bind(this);
    this.handleClickTransformContextMenuItem = this.handleClickTransformContextMenuItem.bind(this);
    this.handleClickColumnMenuToggle = this.handleClickColumnMenuToggle.bind(this);
    this.handleShowSidebar = this.handleShowSidebar.bind(this);
    this.handleHideSidebar = this.handleHideSidebar.bind(this);
    this.getCellClassName = this.getCellClassName.bind(this);
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
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

  handleClickTransformContextMenuToggle(columnTitle, columnType, left, top) {
    this.setState({ activeColumnMenu: null });

    if (this.state.activeTransformationMenu &&
        columnTitle === this.state.activeTransformationMenu.title) {
      // Close the menu
      this.setState({ activeTransformationMenu: null });
    } else {
      this.setState({
        activeTransformationMenu: {
          title: columnTitle,
          currentType: columnType,
          left,
          top,
        },
      });
    }
  }

  handleClickTransformContextMenuItem(newColumnType, oldColumnType) {
    if (newColumnType !== oldColumnType) {
      if (newColumnType === 'date') {
        this.handleShowSidebar({
          columnTitle: this.state.activeTransformationMenu.title,
          oldColumnType,
          newColumnType,
        });
      }
    }

    // Close the context menu
    this.setState({ activeTransformationMenu: null });
  }

  handleClickColumnMenuToggle(columnTitle, left, top, width) {
    this.setState({ activeTransformationMenu: null });

    if (this.state.activeColumnMenu &&
        columnTitle === this.state.activeColumnMenu.title) {
      // Close the menu
      this.setState({ activeColumnMenu: null });
    } else {
      this.setState({
        activeColumnMenu: {
          title: columnTitle,
          left,
          top,
          width,
        },
      });
    }
  }

  handleShowSidebar(sidebar) {
    /* Manually subtract the sidebar width from the datatable width -
    using refs to measure the new width of the parent container grabs
    old width before the DOM updates */
    this.setState({
      transformationSidebar: sidebar,
      width: this.state.width - 300,
      height: this.state.height,
    });
  }

  handleHideSidebar() {
    this.setState({
      width: this.state.width + 300,
      height: this.state.height,
      transformationSidebar: null,
      activeTransformationMenu: null,
    });
  }

  getCellClassName(columnTitle) {
    if (this.state.transformationSidebar &&
      this.state.transformationSidebar.columnTitle === columnTitle) {
      return 'sidebarTargetingColumn';
    }

    return '';
  }

  render() {
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
            value: 'sortAscending',
          },
          {
            label: 'Descending',
            value: 'sortDescending',
          },
        ],
      },
      {
        label: 'Whitespace',
        value: 'whitespace',
        subMenu: [
          {
            label: 'Remove leading and trailing whitespace',
            value: 'removeLeadingTrailingWhitespace',
          },
          {
            label: 'Remove double spaces',
            value: 'removeDoubleWhitespace',
          },
        ],
      },
      {
        label: 'Change case',
        value: 'changeCase',
        subMenu: [
          {
            label: 'To Uppercase',
            value: 'toUppercase',
          },
          {
            label: 'To Lowercase',
            value: 'toLowercase',
          },
          {
            label: 'To Titlecase',
            value: 'toTitlecase',
          },
        ],
      },
    ];

    const cols = this.props.columns.map((column, index) => {
      const columnHeader = (
        <ColumnHeader
          key={index}
          columnType={column.type}
          columnTitle={column.title}
          onClickTransformContextMenuToggle={this.handleClickTransformContextMenuToggle}
          onClickColumnMenuToggle={this.handleClickColumnMenuToggle}
          columnMenuActive={this.state.activeColumnMenu
            && this.state.activeColumnMenu.title === column.title}
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {this.state.transformationSidebar &&
          <DataTableSidebar
            style={{
              width: '300px',
              height: 'calc(100vh - 4rem)',
              marginTop: '4rem',
            }}
            columnTitle={this.state.transformationSidebar.columnTitle}
            newColumnType={this.state.transformationSidebar.newColumnType}
            options={columnTypeOptions}
            onClose={() => this.handleHideSidebar()}
          />
        }
        <div
          className="DatasetTable"
          ref="wrappingDiv"
          style={{
            width: this.state.transformationSidebar ? 'calc(100% - 300px)' : '100%',
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
              onOptionSelected={this.handleClickTransformContextMenuItem}
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
              onOptionSelected={(option) => { console.log(option); }}

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
    );
  }
}

DatasetTable.propTypes = {
  columns: PropTypes.array.isRequired,
};
