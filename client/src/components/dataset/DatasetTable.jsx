import React, { Component, PropTypes } from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import ColumnHeader from './ColumnHeader';
import TransformContextMenu from './TransformContextMenu';
import DataTableSidebar from './DataTableSidebar';

require('../../styles/DatasetTable.scss');

export default class DatasetTable extends Component {

  constructor() {
    super();
    this.state = {
      width: 1024,
      height: 800,
      activeTransformationMenu: null,
      transformationSidebar: null,
    };
    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleClickTransformContextMenuToggle =
      this.handleClickTransformContextMenuToggle.bind(this);
    this.handleClickTransformContextMenuItem = this.handleClickTransformContextMenuItem.bind(this);
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
    });
  }

  handleClickTransformContextMenuToggle(columnTitle, columnType, left, top) {
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

  handleClickTransformContextMenuItem(oldColumnType, newColumnType) {
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

    const cols = this.props.columns.map((column) => {
      const columnHeader = (
        <ColumnHeader
          columnType={column.type}
          columnTitle={column.title}
          onClickTransformContextMenuToggle={this.handleClickTransformContextMenuToggle}
        >
          {column.title}
        </ColumnHeader>
      );
      return (
        <Column
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
            <TransformContextMenu
              options={columnTypeOptions}
              selected={this.state.activeTransformationMenu.currentType}
              style={{
                backgroundColor: 'white',
                padding: '1rem',
                border: '1px solid black',
                width: '8rem',
                marginTop: '0.75rem',
                position: 'absolute',
                top: `${this.state.activeTransformationMenu.top}px`,
                left: `${this.state.activeTransformationMenu.left}px`,
                zIndex: '999',
              }}
              onOptionSelected={this.handleClickTransformContextMenuItem}
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
