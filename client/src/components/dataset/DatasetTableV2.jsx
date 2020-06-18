import React, { Component } from 'react';
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

class DatasetTable extends Component {
  wrappingDiv = React.createRef();

  state = {
    width: 1024,
    height: 800,
    activeDataTypeContextMenu: null,
    activeColumnContextMenu: null,
    sidebarProps: null,
  };

  componentDidMount = () => {
    const datasetHasQuestionGroups = this.props.groups && !this.props.groups.get('main');
    if (this.props.datasetGroupsAvailable && datasetHasQuestionGroups) {
      this.handleGroupsSidebar();
    }

    this.resizeTimeout = setTimeout(() => {
      this.handleResize();
    }, 500);
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount = () => {
    clearTimeout(this.resizeTimeout);
    window.removeEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps) {
    const datasetGroupsAvailableChanged =
      prevProps.datasetGroupsAvailable !== this.props.datasetGroupsAvailable;
    const datasetHasQuestionGroups = this.props.groups && !this.props.groups.get('main');

    if (datasetGroupsAvailableChanged && datasetHasQuestionGroups) {
      this.handleGroupsSidebar();
    }
  }

  getCellClassName = (columnTitle) => {
    const { sidebarProps } = this.state;
    if (
      sidebarProps != null &&
      sidebarProps.column &&
      sidebarProps.column.get('title') === columnTitle
    ) {
      return 'sidebarTargetingColumn';
    }
    return '';
  }

  handleToggleDataTypeContextMenu = ({ column, dimensions }) => {
    const { activeDataTypeContextMenu } = this.state;

    if (
      activeDataTypeContextMenu != null &&
      column.get('title') === activeDataTypeContextMenu.column.get('title')
    ) {
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

  handleToggleColumnContextMenu = ({ column, dimensions }) => {
    const { isLockedFromTransformations } = this.props;

    if (isLockedFromTransformations) return;

    const { activeColumnContextMenu } = this.state;

    if (
      activeColumnContextMenu != null &&
      column.get('title') === activeColumnContextMenu.column.get('title')
    ) {
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

  handleToggleTransformationLog = () => {
    if (
      this.state.sidebarProps &&
      this.state.sidebarProps.type === 'transformationLog'
    ) {
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

  handleToggleCombineColumnSidebar = () => {
    if (
      this.state.sidebarProps &&
      this.state.sidebarProps.type === 'combineColumns'
    ) {
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

  handleToggleExtractMultipleColumnSidebar = () => {
    if (
      this.state.sidebarProps &&
      this.state.sidebarProps.type === 'extractMultiple'
    ) {
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

  handleToggleSplitColumnSidebar = () => {
    if (
      this.state.sidebarProps &&
      this.state.sidebarProps.type === 'splitColumn'
    ) {
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

  handleToggleGeoColumnSidebar = () => {
    if (
      this.state.sidebarProps &&
      this.state.sidebarProps.type === 'generateGeopoints'
    ) {
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

  handleToggleDeriveColumnJavascriptSidebar = () => {
    if (
      this.state.sidebarProps &&
      this.state.sidebarProps.type === 'deriveColumnJavascript'
    ) {
      this.hideSidebar();
    } else {
      this.setState({
        activeDataTypeContextMenu: null,
        activeColumnContextMenu: null,
      });
      this.showSidebar({
        type: 'deriveColumnJavascript',
        displayRight: false,
        onClose: this.hideSidebar,
        onApply: (transformation) => {
          this.props
            .onTransform(transformation)
            .then(() => {
              this.hideSidebar();
            })
            .catch((error) => {
              // eslint-disable-next-line no-console
              console.log(error);
            });
        },
        columns: this.props.columns,
      });
    }
  }

  handleGroupsSidebar = () => {
    if (
      this.state.sidebarProps &&
      this.state.sidebarProps.type === 'groupsList'
    ) {
      this.hideSidebar();
    } else {
      this.setState({
        activeDataTypeContextMenu: null,
        activeColumnContextMenu: null,
      });

      this.showSidebar({
        type: 'groupsList',
        displayRight: false,
        onClose: this.hideSidebar,
        groups: this.getDatasetGroups(),
        selectedGroup: this.props.group ? this.props.group.get('groupId') : 'metadata',
        onSelectGroup: (group) => {
          this.props.handleChangeQuestionGroup(group.id).then(this.hideSidebar);
        },
      });
    }
  };

  // Redirect to merge transform page
  handleMergeDataset = () => {
    const { location, history } = this.props;
    history.push(`${location.pathname}/transformation/merge`);
  }

  // Redirect to derive column transform page: category
  handleDeriveColumnCategory = () => {
    const { location, history } = this.props;
    history.push(`${location.pathname}/transformation/derive-category`);
  }

  handleReverseGeocode = () => {
    const { location, history } = this.props;
    history.push(`${location.pathname}/transformation/reverse-geocode`);
  }

  handleDataTypeContextMenuClicked = ({ column, dataTypeOptions, newColumnType }) => {
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

  handleColumnContextMenuClicked = ({ column, action }) => {
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

  showSidebar = (sidebarProps) => {
    /* Manually subtract the sidebar width from the datatable width -
    using refs to measure the new width of the parent container grabs
    old width before the DOM updates */
    this.setState({
      sidebarProps,
      width: this.state.sidebarProps
        ? this.state.width
        : this.state.width - 300,
      height: this.state.height,
    });
  }

  hideSidebar = () => {
    if (this.state.sidebarProps) {
      this.setState({
        width: this.state.width + 300,
        height: this.state.height,
        sidebarProps: null,
      });
    }
  }

  handleResize = () => {
    this.setState({
      width: this.wrappingDiv.current.clientWidth,
      height: this.wrappingDiv.current.clientHeight,
    });
  }

  handleScroll = () => {
    /* Close any active context menu when the datatable scrolls.
    Ideally, we would dynamically adjust the position of the context menu
    so this would not be necessary, but the dataTable component does
    not have an "onScroll" event, only onScrollEnd, which is too slow. */
    this.setState({
      activeDataTypeContextMenu: null,
      activeColumnContextMenu: null,
    });
  }

  handleClickDatasetControlItem = (menuItem) => {
    if (menuItem === 'combineColumns') {
      this.handleToggleCombineColumnSidebar();
    } else if (menuItem === 'extractMultiple') {
      this.handleToggleExtractMultipleColumnSidebar();
    } else if (menuItem === 'splitColumn') {
      this.handleToggleSplitColumnSidebar();
    } else if (menuItem === 'deriveColumnJavascript') {
      this.handleToggleDeriveColumnJavascriptSidebar();
    } else if (menuItem === 'deriveColumnCategory') {
      this.handleDeriveColumnCategory();
    } else if (menuItem === 'generateGeopoints') {
      this.handleToggleGeoColumnSidebar();
    } else if (menuItem === 'mergeDatasets') {
      this.handleMergeDataset();
    } else if (menuItem === 'reverseGeocode') {
      this.handleReverseGeocode();
    } else {
      throw new Error(`Not yet implemented: ${menuItem}`);
    }
  }

  dismissDataTypeContextMenu = () => {
    this.setState({ activeDataTypeContextMenu: null });
  }

  dismissColumnContextMenu = () => {
    this.setState({ activeColumnContextMenu: null });
  }

  createColumn = (column, columnIndex) => {
    const { isLockedFromTransformations, rows } = this.props;
    const { activeColumnContextMenu } = this.state;
    const index = columnIndex;

    const columnHeader = (
      <ColumnHeader
        key={index}
        column={column}
        onToggleDataTypeContextMenu={this.handleToggleDataTypeContextMenu}
        onToggleColumnContextMenu={this.handleToggleColumnContextMenu}
        disabled={isLockedFromTransformations}
        columnMenuActive={
          activeColumnContextMenu != null &&
          !isLockedFromTransformations &&
          activeColumnContextMenu.column.get('title') === column.get('title')
        }
        onRemoveSort={transformation => this.props.onTransform(transformation)}
      />
    );

    const formatCell = idx => (props) => {
      const formattedCellValue = formatCellValue(
        column.get('type'),
        rows.getIn([props.rowIndex, idx])
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
        cellClassName={this.getCellClassName(column.get('title'))}
        key={column.get('idx') || index}
        header={columnHeader}
        cell={formatCell(column.get('idx') || index)}
        width={200}
      />
    );
  };

  getColumns = () => {
    const { columns, groupAvailable } = this.props;

    let cols;
    let columnIndex = 0;

    const columnMap = (column) => {
      const argIndex = columnIndex;
      columnIndex += 1;
      return this.createColumn(column, argIndex);
    };

    if (groupAvailable) {
      cols = columns.map(columnMap);
    }

    return cols;
  };

  getDatasetGroups = () => {
    const { groups, datasetGroupsAvailable } = this.props;

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
  }

  // renders
  renderHeader = () => {
    const { Header: DatasetHeader } = this.props;

    return (
      <DatasetHeader
        {...this.props.headerProps}
        history={this.props.history}
        isLockedFromTransformations={this.props.isLockedFromTransformations}
        onNavigateToVisualise={this.props.onNavigateToVisualise}
        onClickTransformMenuItem={this.handleClickDatasetControlItem}
        onToggleTransformationLog={this.handleToggleTransformationLog}
      />
    )
;
  }

  render() {
    const cols = this.getColumns();
    const sidebarStyle = {
      display: 'flex',
      flexDirection:
      this.state.sidebarProps && this.state.sidebarProps.displayRight
          ? 'row-reverse'
          : 'row',
    };

    return (
      <React.Fragment>
        {this.renderHeader()}

        {this.props.datasetGroupsAvailable ? (
          <div className="DatasetTable">
            <div style={sidebarStyle}>
              <NewDatasetWrapper
                sidebarProps={this.state.sidebarProps}
                datasetId={this.props.datasetId}
                pendingTransformations={this.props.pendingTransformations}
                wrapperDivRef={this.wrappingDiv}
                transformations={this.props.transformations}
                activeDataTypeContextMenu={this.state.activeDataTypeContextMenu}
                handleGroupsSidebar={this.handleGroupsSidebar}
                handleDataTypeContextMenuClicked={
                    this.handleDataTypeContextMenuClicked
                  }
                dismissDataTypeContextMenu={this.dismissDataTypeContextMenu}
                activeColumnContextMenu={this.state.activeColumnContextMenu}
                handleColumnContextMenuClicked={
                    this.handleColumnContextMenuClicked
                  }
                dismissColumnContextMenu={this.dismissColumnContextMenu}
                handleScroll={this.handleScroll}
                width={this.state.width}
                height={this.state.height}
                cols={cols}
                rows={this.props.rows}
                columns={this.props.columns}
                groupInView={this.state.groupInView}
                datasetHasQuestionGroups={!this.props.groups.get('main')}
                groupAvailable={this.props.groupAvailable}
              />
            </div>
          </div>
        ) : (
          <LoadingSpinner />
        )}
      </React.Fragment>
    );
  }
}

DatasetTable.propTypes = {
  datasetId: PropTypes.string.isRequired,
  columns: PropTypes.object,
  group: PropTypes.object,
  rows: PropTypes.object,
  groups: PropTypes.object,
  transformations: PropTypes.object,
  pendingTransformations: PropTypes.object.isRequired,
  onTransform: PropTypes.func.isRequired,
  onUndoTransformation: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  onNavigateToVisualise: PropTypes.func.isRequired,
  isLockedFromTransformations: PropTypes.bool,
  intl: intlShape,
  history: PropTypes.object.isRequired,
  Header: PropTypes.any,
  headerProps: PropTypes.object,
  groupAvailable: PropTypes.bool,
  datasetGroupsAvailable: PropTypes.bool,
  handleChangeQuestionGroup: PropTypes.func,
  currentGroup: PropTypes.object,
};

export default withRouter(injectIntl(DatasetTable));
