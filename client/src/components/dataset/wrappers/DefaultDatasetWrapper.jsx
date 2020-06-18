import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import { Table } from 'fixed-data-table-2';
import DataTableSidebar from '../DataTableSidebar';
import DataTypeContextMenu from '../context-menus/DataTypeContextMenu';
import ColumnContextMenu from '../context-menus/ColumnContextMenu';

class DefaultDatasetWrapper extends React.Component {
  render() {
    const {
      sidebarProps,
      intl,
      transformations,
      isLockedFromTransformations,
      datasetId,
      pendingTransformations,
      wrapperDivRef,
      activeDataTypeContextMenu,
      handleDataTypeContextMenuClicked,
      dismissDataTypeContextMenu,
      activeColumnContextMenu,
      handleColumnContextMenuClicked,
      dismissColumnContextMenu,
      handleScroll,
      columns,
      rows,
      width,
      height,
      cols,
    } = this.props;

    return (
      <React.Fragment>
        <div
          className={`sidebarWrapper ${
            sidebarProps ? 'expanded' : 'collapsed'
          }`}
        >
          {sidebarProps && (
            <DataTableSidebar
              {...sidebarProps}
              intl={intl}
              transformations={transformations}
              isLockedFromTransformations={isLockedFromTransformations}
              datasetId={datasetId}
              pendingTransformations={pendingTransformations}
            />
          )}
        </div>
        <div
          className={`wrapper ${sidebarProps ? 'hasSidebar' : 'noSidebar'}`}
          ref={wrapperDivRef}
        >
          {activeDataTypeContextMenu != null && (
            <DataTypeContextMenu
              column={activeDataTypeContextMenu.column}
              dimensions={activeDataTypeContextMenu.dimensions}
              onContextMenuItemSelected={handleDataTypeContextMenuClicked}
              onWindowClick={dismissDataTypeContextMenu}
            />
          )}
          {activeColumnContextMenu && !isLockedFromTransformations && (
            <ColumnContextMenu
              column={activeColumnContextMenu.column}
              dimensions={activeColumnContextMenu.dimensions}
              onContextMenuItemSelected={handleColumnContextMenuClicked}
              onWindowClick={dismissColumnContextMenu}
              left={
                columns.last().get('title') ===
                activeColumnContextMenu.column.get('title')
              }
            />
          )}
          <Table
            groupHeaderHeight={30}
            headerHeight={60}
            rowHeight={30}
            rowsCount={rows.size}
            width={width}
            height={height}
            onScrollStart={handleScroll}
          >
            {cols}
          </Table>
        </div>
      </React.Fragment>
    );
  }
}


DefaultDatasetWrapper.propTypes = {
  intl: intlShape,
  transformations: PropTypes.object,
  isLockedFromTransformations: PropTypes.bool,
  sidebarProps: PropTypes.object,
  datasetId: PropTypes.string.isRequired,
  pendingTransformations: PropTypes.object.isRequired,
  wrapperDivRef: PropTypes.any,
  activeDataTypeContextMenu: PropTypes.object,
  width: PropTypes.number,
  height: PropTypes.number,
  cols: PropTypes.object,
  columns: PropTypes.object,
  rows: PropTypes.object,
  handleDataTypeContextMenuClicked: PropTypes.func,
  dismissDataTypeContextMenu: PropTypes.func,
  activeColumnContextMenu: PropTypes.object,
  handleColumnContextMenuClicked: PropTypes.func,
  dismissColumnContextMenu: PropTypes.func,
  handleScroll: PropTypes.func,
};
export default injectIntl(DefaultDatasetWrapper);
