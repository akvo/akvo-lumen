import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Column, Cell } from 'fixed-data-table-2';
import moment from 'moment';
import { withRouter } from 'react-router';
import { injectIntl, intlShape } from 'react-intl';
import ColumnHeader from './ColumnHeader';
import LoadingSpinner from '../common/LoadingSpinner';
import NewDatasetWrapper from './wrappers/NewDatasetWrapper';

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

  // todo: review groupInView state prop
  const [groupInView] = useState(null);

  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(800);
  const [activeDataTypeContextMenu, setActiveDataTypeContextMenu] = useState(null);
  const [activeColumnContextMenu, setActiveColumnContextMenu] = useState(null);
  const [sidebarProps, setSidebarProps] = useState(null);

  const hideSidebar = () => {
    if (sidebarProps) {
    // TODO review following line!
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
    setWidth(wrappingDiv.current.clientWidth);
    setHeight(wrappingDiv.current.clientHeight);
  };

  const getDatasetGroups = () => {
    const { groups, datasetGroupsAvailable } = props;

    if (!datasetGroupsAvailable) {
      return [];
    }

    const groupsObject = groups.toJS();
    let groupNames = [];

    // trying to keep metadata at the top
    // refactor if you can think of a better implementation
    const withoutMetadata = Object.keys(groupsObject).filter(group => group !== 'metadata');

    groupNames = withoutMetadata
      .reduce((acc, curr) => {
        const column = groups.toJS()[curr][0];

        if (column) {
          acc.push({ id: column.groupId, name: column.groupName });
        }

        return acc;
      }, []);

    groupNames.unshift({ id: 'metadata', name: 'metadata' });


    return groupNames;
  };

  const handleGroupsSidebar = () => {
    if (
      sidebarProps &&
      sidebarProps.type === 'groupsList'
    ) {
      hideSidebar();
    } else {
      setActiveDataTypeContextMenu(null);
      setActiveColumnContextMenu(null);

      showSidebar({
        type: 'groupsList',
        displayRight: false,
        onClose: hideSidebar,
        groups: getDatasetGroups(),
        onSelectGroup: (group) => {
          props.handleChangeQuestionGroup(group.id).then(hideSidebar);
        },
      });
    }
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

  const prevDatasetGroupsAvailable = usePrevious(props.datasetGroupsAvailable);

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

  const handleToggleTransformationLog = () => {
    if (
      sidebarProps &&
      sidebarProps.type === 'transformationLog'
    ) {
      hideSidebar();
    } else {
      setActiveDataTypeContextMenu(null);
      setActiveColumnContextMenu(null);

      showSidebar({
        type: 'transformationLog',
        displayRight: true,
        onClose: hideSidebar,
        onUndo: props.onUndoTransformation,
        columns: props.columns,
      });
    }
  };

  const handleToggleCombineColumnSidebar = () => {
    if (
      sidebarProps &&
      sidebarProps.type === 'combineColumns'
    ) {
      hideSidebar();
    } else {
      setActiveDataTypeContextMenu(null);
      setActiveColumnContextMenu(null);

      showSidebar({
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
    }
  };

  const handleToggleExtractMultipleColumnSidebar = () => {
    if (
      sidebarProps &&
      sidebarProps.type === 'extractMultiple'
    ) {
      hideSidebar();
    } else {
      setActiveDataTypeContextMenu(null);
      setActiveColumnContextMenu(null);

      showSidebar({
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
    }
  };

  const handleToggleSplitColumnSidebar = () => {
    if (
      sidebarProps &&
      sidebarProps.type === 'splitColumn'
    ) {
      hideSidebar();
    } else {
      setActiveDataTypeContextMenu(null);
      setActiveColumnContextMenu(null);
      showSidebar({
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
    }
  };

  const handleToggleGeoColumnSidebar = () => {
    if (
      sidebarProps &&
      sidebarProps.type === 'generateGeopoints'
    ) {
      hideSidebar();
    } else {
      setActiveDataTypeContextMenu(null);
      setActiveColumnContextMenu(null);
      showSidebar({
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
    }
  };

  const handleToggleDeriveColumnJavascriptSidebar = () => {
    if (
      sidebarProps &&
      sidebarProps.type === 'deriveColumnJavascript'
    ) {
      hideSidebar();
    } else {
      setActiveDataTypeContextMenu(null);
      setActiveColumnContextMenu(null);
      showSidebar({
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
    }
  };


  // Redirect to merge transform page
  const handleMergeDataset = () => {
    const { location, history } = props;
    history.push(`${location.pathname}/transformation/merge`);
  };

  // Redirect to derive column transform page: category
  const handleDeriveColumnCategory = () => {
    const { location, history } = props;
    history.push(`${location.pathname}/transformation/derive-category`);
  };

  const handleReverseGeocode = () => {
    const { location, history } = props;
    history.push(`${location.pathname}/transformation/reverse-geocode`);
  };

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

  const handleClickDatasetControlItem = (menuItem) => {
    if (menuItem === 'combineColumns') {
      handleToggleCombineColumnSidebar();
    } else if (menuItem === 'extractMultiple') {
      handleToggleExtractMultipleColumnSidebar();
    } else if (menuItem === 'splitColumn') {
      handleToggleSplitColumnSidebar();
    } else if (menuItem === 'deriveColumnJavascript') {
      handleToggleDeriveColumnJavascriptSidebar();
    } else if (menuItem === 'deriveColumnCategory') {
      handleDeriveColumnCategory();
    } else if (menuItem === 'generateGeopoints') {
      handleToggleGeoColumnSidebar();
    } else if (menuItem === 'mergeDatasets') {
      handleMergeDataset();
    } else if (menuItem === 'reverseGeocode') {
      handleReverseGeocode();
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
    )
;
  };


  const cols = getColumns();
  const sidebarStyle = {
    display: 'flex',
    flexDirection:
    sidebarProps && sidebarProps.displayRight
        ? 'row-reverse'
        : 'row',
  };

  return (
    <React.Fragment>
      {renderHeader()}

      {props.datasetGroupsAvailable ? (
        <div className="DatasetTable">
          <div style={sidebarStyle}>
            <NewDatasetWrapper
              sidebarProps={sidebarProps}
              selectedGroup={props.group ? props.group.get('groupId') : 'metadata'}
              datasetId={props.datasetId}
              pendingTransformations={props.pendingTransformations}
              wrapperDivRef={wrappingDiv}
              transformations={props.transformations}
              activeDataTypeContextMenu={activeDataTypeContextMenu}
              handleGroupsSidebar={handleGroupsSidebar}
              handleDataTypeContextMenuClicked={handleDataTypeContextMenuClicked}
              dismissDataTypeContextMenu={() => setActiveDataTypeContextMenu(null)}
              activeColumnContextMenu={activeColumnContextMenu}
              handleColumnContextMenuClicked={handleColumnContextMenuClicked}
              dismissColumnContextMenu={() => setActiveColumnContextMenu(null)}
              handleScroll={handleScroll}
              width={width}
              height={height}
              cols={cols}
              rows={props.rows}
              columns={props.columns}
              groupInView={groupInView}
              datasetHasQuestionGroups={!props.groups.get('main')}
              groupAvailable={props.groupAvailable}
            />
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
