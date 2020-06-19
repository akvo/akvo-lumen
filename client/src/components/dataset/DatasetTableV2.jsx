import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Column, Cell, Table } from 'fixed-data-table-2';
import moment from 'moment';
import { withRouter } from 'react-router';
import { injectIntl, intlShape } from 'react-intl';
import ColumnHeader from './ColumnHeader';
import LoadingSpinner from '../common/LoadingSpinner';
import { getDatasetGroups } from '../../utilities/dataset';
import DataTableSidebar from './DataTableSidebar';
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

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


function DatasetTable(props) {
  const wrappingDiv = useRef(null);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(800);
  const [activeDataTypeContextMenu, setActiveDataTypeContextMenu] = useState(null);
  const [activeColumnContextMenu, setActiveColumnContextMenu] = useState(null);
  const [sidebarProps, setSidebarProps] = useState(null);
  const prevDatasetGroupsAvailable = usePrevious(props.datasetGroupsAvailable);

  const hideSidebar = () => {
    if (sidebarProps) {
      setSidebarProps(null);
      setWidth(width + 300);
    // TODO review following line!
      setHeight(height);
    }
  };

  const showSidebar = (sbProps) => {
    /* Manually subtract the sidebar width from the datatable width -
    using refs to measure the new width of the parent container grabs
    old width before the DOM updates */

    setSidebarProps(sbProps);
    setWidth(sbProps ? width : width - 300);
    // TODO review following line!
    setHeight(height);
  };

  const handleResize = () => {
    if (wrappingDiv.current) {
      setWidth(wrappingDiv.current.clientWidth);
      setHeight(wrappingDiv.current.clientHeight);
    }
  };

  const handleSidebarProps = (sbProps) => {
    if (
      sidebarProps &&
      sidebarProps.type === sbProps.type
    ) {
      hideSidebar();
    } else {
      setActiveDataTypeContextMenu(null);
      setActiveColumnContextMenu(null);
      showSidebar(sbProps);
    }
  };

  const handleGroupsSidebar = () => {
    handleSidebarProps({
      type: 'groupsList',
      displayRight: false,
      onClose: hideSidebar,
      groups: getDatasetGroups(props.groups, props.datasetGroupsAvailable),
      onSelectGroup: (group) => {
        props.handleChangeQuestionGroup(group.id).then(hideSidebar);
      },
    });
  };

  useEffect(() => {
    const datasetHasQuestionGroups = props.groups && !props.groups.get('main');
    if (props.datasetGroupsAvailable && datasetHasQuestionGroups) {
      handleGroupsSidebar();
    }

    const resizeTimeout = setTimeout(() => {
      handleResize();
    }, 500);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const datasetGroupsAvailableChanged =
      prevDatasetGroupsAvailable !== props.datasetGroupsAvailable;
    const datasetHasQuestionGroups = props.groups && !props.groups.get('main');

    if (datasetGroupsAvailableChanged && datasetHasQuestionGroups) {
      handleGroupsSidebar();
    }
  }, [props.datasetGroupsAvailable, props.groups]);

  const getCellClassName = (columnTitle) => {
    if (
      sidebarProps != null &&
      sidebarProps.column &&
      sidebarProps.column.get('title') === columnTitle
    ) {
      return 'sidebarTargetingColumn';
    }
    return '';
  };

  const handleToggleDataTypeContextMenu = ({ column, dimensions }) => {
    if (
      activeDataTypeContextMenu != null &&
      column.get('title') === activeDataTypeContextMenu.column.get('title')
    ) {
      setActiveDataTypeContextMenu(null);
    } else {
      setActiveDataTypeContextMenu({
        column,
        dimensions,
      });
      setActiveColumnContextMenu(null);
    }
  };

  const handleToggleColumnContextMenu = ({ column, dimensions }) => {
    const { isLockedFromTransformations } = props;

    if (isLockedFromTransformations) return;

    if (
      activeColumnContextMenu != null &&
      column.get('title') === activeColumnContextMenu.column.get('title')
    ) {
      setActiveColumnContextMenu(null);
    } else {
      setActiveDataTypeContextMenu(null);
      setActiveColumnContextMenu({
        column,
        dimensions,
      });
    }
  };

  const handleToggleTransformationLog = () =>
    handleSidebarProps({
      type: 'transformationLog',
      displayRight: true,
      onClose: hideSidebar,
      onUndo: props.onUndoTransformation,
      columns: props.columns,
    });

  const handleDataTypeContextMenuClicked = ({ column, dataTypeOptions, newColumnType }) => {
    setActiveDataTypeContextMenu(null);
    if (newColumnType !== column.get('type')) {
      showSidebar({
        type: 'edit',
        column,
        dataTypeOptions,
        newColumnType,
        onClose: hideSidebar,
        onApply: (transformation) => {
          hideSidebar();
          props.onTransform(transformation);
        },
      });
    }
  };

  const handleColumnContextMenuClicked = ({ column, action }) => {
    setActiveColumnContextMenu(null);
    switch (action.get('op')) {
      case 'core/filter-column':
        showSidebar({
          type: 'filter',
          column,
          onClose: () => hideSidebar(),
          onApply: (transformation) => {
            hideSidebar();
            props.onTransform(transformation);
          },
        });
        break;
      case 'core/rename-column':
        showSidebar({
          type: 'renameColumn',
          column,
          onClose: () => hideSidebar(),
          onApply: (transformation) => {
            hideSidebar();
            props.onTransform(transformation);
          },
        });
        break;
      default:
        props.onTransform(action);
    }
  };

  const handleScroll = () => {
    /* Close any active context menu when the datatable scrolls.
    Ideally, we would dynamically adjust the position of the context menu
    so this would not be necessary, but the dataTable component does
    not have an "onScroll" event, only onScrollEnd, which is too slow. */
    setActiveColumnContextMenu(null);
    setActiveDataTypeContextMenu(null);
  };

  // eslint-disable-next-line consistent-return
  const handleClickDatasetControlItem = (menuItem) => {
    if (menuItem === 'combineColumns') {
      handleSidebarProps({
        type: 'combineColumns',
        displayRight: false,
        onClose: hideSidebar,
        onApply: (transformation) => {
          props.onTransform(transformation).then(() => {
            hideSidebar();
          });
        },
        columns: props.columns,
      });
    } else if (menuItem === 'extractMultiple') {
      handleSidebarProps({
        type: 'extractMultiple',
        displayRight: false,
        onClose: hideSidebar,
        onApply: (transformation) => {
          props.onTransform(transformation).then(() => {
            hideSidebar();
          });
        },
        columns: props.columns,
      });
    } else if (menuItem === 'splitColumn') {
      handleSidebarProps({
        type: 'splitColumn',
        displayRight: false,
        onClose: hideSidebar,
        onApply: (transformation) => {
          props.onTransform(transformation).then(() => {
            hideSidebar();
          });
        },
        columns: props.columns,
      });
    } else if (menuItem === 'deriveColumnJavascript') {
      handleSidebarProps({
        type: 'deriveColumnJavascript',
        displayRight: false,
        onClose: hideSidebar,
        onApply: (transformation) => {
          props
            .onTransform(transformation)
            .then(() => {
              hideSidebar();
            })
            .catch((error) => {
              // eslint-disable-next-line no-console
              console.log(error);
            });
        },
        columns: props.columns,
      });
    } else if (menuItem === 'deriveColumnCategory') {
      props.history.push(`${props.location.pathname}/transformation/derive-category`);
    } else if (menuItem === 'generateGeopoints') {
      handleSidebarProps({
        type: 'generateGeopoints',
        displayRight: false,
        onClose: hideSidebar,
        onApply: (transformation) => {
          props.onTransform(transformation).then(() => {
            hideSidebar();
          });
        },
        columns: props.columns,
      });
    } else if (menuItem === 'mergeDatasets') {
      props.history.push(`${props.location.pathname}/transformation/merge`);
    } else if (menuItem === 'reverseGeocode') {
      props.history.push(`${props.location.pathname}/transformation/reverse-geocode`);
    } else {
      throw new Error(`Not yet implemented: ${menuItem}`);
    }
  };

  const createColumn = (column, columnIndex) => {
    const { isLockedFromTransformations, rows } = props;

    const index = columnIndex;

    const columnHeader = (
      <ColumnHeader
        key={index}
        column={column}
        onToggleDataTypeContextMenu={handleToggleDataTypeContextMenu}
        onToggleColumnContextMenu={handleToggleColumnContextMenu}
        disabled={isLockedFromTransformations}
        columnMenuActive={
          activeColumnContextMenu != null &&
          !isLockedFromTransformations &&
          activeColumnContextMenu.column.get('title') === column.get('title')
        }
        onRemoveSort={transformation => props.onTransform(transformation)}
      />
    );

    const formatCell = idx => (propsData) => {
      const formattedCellValue = formatCellValue(
        column.get('type'),
        rows.getIn([propsData.rowIndex, idx])
      );

      const cellStyle =
        column.get('type') === 'number'
          ? { textAlign: 'right', width: '100%' }
          : { textAlign: 'left' };

      return (
        <Cell style={cellStyle} className={column.get('type')}>
          <span title={formattedCellValue}>{formattedCellValue}</span>
        </Cell>
      );
    };

    return (
      <Column
        cellClassName={getCellClassName(column.get('title'))}
        key={column.get('idx') || index}
        header={columnHeader}
        cell={formatCell(column.get('idx') || index)}
        width={200}
      />
    );
  };

  const getColumns = () => {
    const { columns, groupAvailable } = props;

    let cols;
    let columnIndex = 0;

    const columnMap = (column) => {
      const argIndex = columnIndex;
      columnIndex += 1;
      return createColumn(column, argIndex);
    };

    if (groupAvailable) {
      cols = columns.map(columnMap);
    }

    return cols;
  };

  // renders
  const renderHeader = () => {
    const { Header: DatasetHeader } = props;

    return (
      <DatasetHeader
        {...props.headerProps}
        history={props.history}
        isLockedFromTransformations={props.isLockedFromTransformations}
        onNavigateToVisualise={props.onNavigateToVisualise}
        onClickTransformMenuItem={handleClickDatasetControlItem}
        onToggleTransformationLog={handleToggleTransformationLog}
      />
    );
  };

  return (
    <React.Fragment>
      {renderHeader()}

      {props.datasetGroupsAvailable ? (
        <div className="DatasetTable">
          <div
            style={{
              display: 'flex',
              flexDirection:
                sidebarProps && sidebarProps.displayRight
                  ? 'row-reverse'
                  : 'row',
            }}
          >
            <div
              className={`sidebarWrapper ${
                sidebarProps ? 'expanded' : 'collapsed'
              }`}
            >
              {sidebarProps && (
                <DataTableSidebar
                  {...sidebarProps}
                  selectedGroup={
                    props.group ? props.group.get('groupId') : 'metadata'
                  }
                  intl={props.intl}
                  transformations={props.transformations}
                  isLockedFromTransformations={
                    props.isLockedFromTransformations
                  }
                  datasetId={props.datasetId}
                  pendingTransformations={props.pendingTransformations}
                />
              )}
            </div>

            {!sidebarProps && !props.groups.get('main') && (
              <div className="toggle-groups">
                <span
                  onClick={() => handleGroupsSidebar()}
                  className="clickable"
                >
                  <i className="fa fa-angle-right" />
                </span>
              </div>
            )}

            {props.groupAvailable ? (
              <div
                ref={wrappingDiv}
                className={`wrapper ${
                  sidebarProps ? 'hasSidebar' : 'noSidebar'
                }`}
              >
                {activeDataTypeContextMenu != null && (
                  <DataTypeContextMenu
                    column={activeDataTypeContextMenu.column}
                    dimensions={activeDataTypeContextMenu.dimensions}
                    onContextMenuItemSelected={handleDataTypeContextMenuClicked}
                    onWindowClick={() => setActiveDataTypeContextMenu(null)}
                  />
                )}

                {activeColumnContextMenu && !props.isLockedFromTransformations && (
                  <ColumnContextMenu
                    column={activeColumnContextMenu.column}
                    dimensions={activeColumnContextMenu.dimensions}
                    onContextMenuItemSelected={handleColumnContextMenuClicked}
                    onWindowClick={() => setActiveDataTypeContextMenu(null)}
                    left={
                      prop.columns.last().get('title') ===
                      activeColumnContextMenu.column.get('title')
                    }
                  />
                )}
                <Table
                  groupHeaderHeight={30}
                  headerHeight={60}
                  rowHeight={30}
                  rowsCount={props.rows.size}
                  width={width}
                  height={height}
                  onScrollStart={handleScroll}
                >
                  {getColumns()}
                </Table>
              </div>
            ) : (
              <LoadingSpinner />
            )}
          </div>
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </React.Fragment>
  );
}

DatasetTable.propTypes = {
  Header: PropTypes.any,
  columns: PropTypes.object,
  currentGroup: PropTypes.object,
  datasetGroupsAvailable: PropTypes.bool,
  datasetId: PropTypes.string.isRequired,
  group: PropTypes.object,
  groupAvailable: PropTypes.bool,
  groups: PropTypes.object,
  handleChangeQuestionGroup: PropTypes.func,
  headerProps: PropTypes.object,
  history: PropTypes.object.isRequired,
  intl: intlShape,
  isLockedFromTransformations: PropTypes.bool,
  location: PropTypes.object.isRequired,
  onNavigateToVisualise: PropTypes.func.isRequired,
  onTransform: PropTypes.func.isRequired,
  onUndoTransformation: PropTypes.func.isRequired,
  pendingTransformations: PropTypes.object.isRequired,
  rows: PropTypes.object,
  transformations: PropTypes.object,
};

export default withRouter(injectIntl(DatasetTable));
