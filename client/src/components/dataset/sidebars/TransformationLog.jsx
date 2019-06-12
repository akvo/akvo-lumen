import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { ensureDatasetFullyLoaded } from '../../../actions/dataset';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import { columnTitle } from '../../../domain/dataset';
import * as mergeTrainsformationUtils from '../../transformation/merge/utils';

require('./TransformationLog.scss');

function deriveTransformationDescription(transformation) {
  const newColumnTitle = transformation.getIn(['args', 'newColumnTitle']);
  const code = transformation.getIn(['args', 'code']);
  return (
    <FormattedMessage
      id="derived_transform_description"
      values={{ newColumnTitle, code: <code>{code}</code> }}
    />
  );
}

function deriveCategoryTransformationDescription(transformation, columns) {
  const newColumnTitle = transformation.getIn(['args', 'target', 'column', 'title']);
  const columnType = transformation.getIn(['args', 'derivation', 'type']);
  const columnSource = columnTitle(transformation.getIn(['args', 'source', 'column', 'columnName']),
    columns);
  return (
    <FormattedMessage
      id="derived_category_transform_description"
      values={{ newColumnTitle, columnType, columnSource }}
    />
  );
}


// Search the transformation list to find the column title and fall back to the columnTitle
// function if this column hasn't been transformed before.
function findTitle(columnName, transformations, index, columns) {
  const historyTransformation = transformations.take(index).reverse().find(transformation =>
      transformation.getIn(['changedColumns', columnName]));
  if (historyTransformation != null) {
    return historyTransformation.getIn(['changedColumns', columnName, 'after', 'title']);
  }

  const futureTransformation = transformations.skip(index).find(transformation =>
    transformation.getIn(['changedColumns', columnName]));
  if (futureTransformation != null) {
    return futureTransformation.getIn(['changedColumns', columnName, 'before', 'title']);
  }

  return columnTitle(columnName, columns);
}

function extractMultipleTransformationDescription(transformations, index) {
  const transformation = transformations.get(index);

  const extractedColumnTitle = transformation.getIn(['args', 'selectedColumn', 'title']);

  const changedColumns = transformation.getIn(['changedColumns']).toJS();
  const newColumnsTitle = Object.values(changedColumns).map(o => o.after.title).join(', ');
  return (
    <FormattedMessage
      id="extract_multiple_log"
      values={{
        extractedColumnTitle,
        newColumnsTitle,
      }}
    />
  );
}

function splitColumnTransformationDescription(transformations, index) {
  const transformation = transformations.get(index);

  const extractedColumnTitle = transformation.getIn(['args', 'selectedColumn', 'title']);
  const pattern = transformation.getIn(['args', 'pattern']);
  const newColumnNamePrefix = transformation.getIn(['args', 'newColumnName']);

  return (
    <FormattedMessage
      id="split_column_log"
      values={{
        extractedColumnTitle,
        pattern,
        newColumnNamePrefix,
      }}
    />
  );
}


function combineTransformationDescription(transformations, index, columns) {
  const transformation = transformations.get(index);
  const firstColumnName = transformation.getIn(['args', 'columnNames', 0]);
  const secondColumnName = transformation.getIn(['args', 'columnNames', 1]);
  const firstTitle = findTitle(firstColumnName, transformations, index, columns);
  const secondTitle = findTitle(secondColumnName, transformations, index, columns);
  const newColumnTitle = transformation.getIn(['args', 'newColumnTitle']);
  return (
    <FormattedMessage
      id="combine_transform_description"
      values={{
        firstTitle,
        secondTitle,
        newColumnTitle,
      }}
    />
  );
}

function geoTransformationDescription(transformations, index, columns) {
  const transformation = transformations.get(index);
  const columnNameLat = transformation.getIn(['args', 'columnNameLat']);
  const columnNameLong = transformation.getIn(['args', 'columnNameLong']);
  const columnTitleLat = findTitle(columnNameLat, transformations, index, columns);
  const columnTitleLong = findTitle(columnNameLong, transformations, index, columns);
  const columnTitleGeo = transformation.getIn(['args', 'columnTitleGeo']);
  return (
    <FormattedMessage
      id="geo_transform_description"
      values={{
        columnTitleLat,
        columnTitleLong,
        columnTitleGeo,
      }}
    />
  );
}

function textTransformationDescription(transformations, index, columns) {
  const transformation = transformations.get(index);
  const columnName = transformation.getIn(['args', 'columnName']);
  const title = findTitle(columnName, transformations, index, columns);
  return ({
    'core/to-lowercase': <FormattedMessage id="to_lowercase" values={{ title }} />,
    'core/to-uppercase': <FormattedMessage id="to_uppercase" values={{ title }} />,
    'core/to-titlecase': <FormattedMessage id="to_titlecase" values={{ title }} />,
    'core/trim': <FormattedMessage id="trimmed_whitespace" values={{ title }} />,
    'core/trim-doublespace': <FormattedMessage id="removed_double_space" values={{ title }} />,
  })[transformation.get('op')];
}

function mergeDatasetsDescription(transformation, dependentDatasets) {
  const source = transformation.getIn(['args', 'source']);
  const sourceDatasetId = source.get('datasetId');
  const sourceMergeColumnNames = source.get('mergeColumns').toSet();
  const sourceAggregationColumnName = source.get('aggregationColumn');
  const sourceAggregationDirection = source.get('aggregationDirection');
  const sourceDataset = dependentDatasets[sourceDatasetId];

  if (sourceDataset == null) {
    // Show a simpler description if we haven't loaded the source dataset yet
    return <FormattedMessage id="merged_dataset" values={{ title: `dataset ${sourceDatasetId}` }} />;
  }

  const sourceColumns = sourceDataset.get('columns');
  const sourceDatasetTitle = sourceDataset.get('name');
  const mergedColumnsTitles = sourceDataset
    .get('columns')
    .filter(column => sourceMergeColumnNames.has(column.get('columnName')))
    .map(column => column.get('title'));
  const sourceAggregationColumn =
    sourceAggregationColumnName == null ?
      null :
      sourceColumns.find(column => column.get('columnName') === sourceAggregationColumnName);

  const directionLabels = mergeTrainsformationUtils.directionLabels(sourceAggregationColumn);
  const directionLabel = sourceAggregationDirection === 'ASC' ? directionLabels.asc : directionLabels.desc;

  return (
    <div className="mergedColumnsInfo">
      <FormattedMessage id="merged_dataset" values={{ title: sourceDatasetTitle }} />
      <ul className="mergedColumnTitles">
        {mergedColumnsTitles.map((title, idx) => <li key={idx}>{title}</li>)}
      </ul>
      { sourceAggregationColumn &&
        <p className="aggregationInfo">
          aggregated by <em>{directionLabel} {sourceAggregationColumn.get('title')}</em>
        </p>
      }
    </div>
  );
}

function transformationDescription(transformations, index, columns, dependentDatasets) {
  const transformation = transformations.get(index);
  const op = transformation.get('op');
  const columnName = transformation.getIn(['args', 'columnName']);
  const title = transformation.getIn(['changedColumns', columnName, 'before', 'title']);
  switch (op) {
    case 'core/to-lowercase':
    case 'core/to-uppercase':
    case 'core/to-titlecase':
    case 'core/trim':
    case 'core/trim-doublespace':
      return textTransformationDescription(transformations, index, columns);
    case 'core/change-datatype':
      return `${title} datatype to ${transformation.getIn(['args', 'newType'])}`;
    case 'core/sort-column':
      return (
        <FormattedMessage
          id="sorted_column"
          values={{ title, direction: transformation.getIn(['args', 'sortDirection']) }}
        />
      );
    case 'core/rename-column':
      return (
        <FormattedMessage
          id="renamed_column"
          values={{ from: title, to: transformation.getIn(['args', 'newColumnTitle']) }}
        />
      );
    case 'core/filter-column':
      return (
        <FormattedMessage
          id="filter_column"
          values={{ title: transformation.getIn(['args', 'columnTitle']) }}
        />
      );
    case 'core/delete-column':
      return <FormattedMessage id="deleted_column" values={{ title }} />;
    case 'core/extract-multiple':
      return extractMultipleTransformationDescription(transformations, index);
    case 'core/split-column':
      return splitColumnTransformationDescription(transformations, index);
    case 'core/reverse-geocode':
      return <FormattedMessage id="reverse_geocode" />;
    case 'core/combine':
      return combineTransformationDescription(transformations, index, columns);
    case 'core/derive':
      return deriveTransformationDescription(transformation);
    case 'core/derive-category':
      return deriveCategoryTransformationDescription(transformation, columns);
    case 'core/generate-geopoints':
      return geoTransformationDescription(transformations, index, columns);
    case 'core/merge-datasets':
      return mergeDatasetsDescription(transformation, dependentDatasets);
    default:
      return op;
  }
}

function TransformationListItem({ transformations, index, columns, dependentDatasets }) {
  const transformation = transformations.get(index);
  const isUndoingTransformation = transformation.get('undo');

  return (
    <div style={{ opacity: isUndoingTransformation ? 0.5 : 1 }}>
      <div>
        {transformationDescription(transformations, index, columns, dependentDatasets)}
      </div>
    </div>);
}

TransformationListItem.propTypes = {
  transformations: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  columns: PropTypes.object.isRequired,
  dependentDatasets: PropTypes.object.isRequired,
};

class TransformationList extends Component {

  constructor(props) {
    super(props);

    this.state = {
      dependentDatasets: {},
    };
  }

  componentWillMount() {
    // Fetch all dependent datasets (currently  only due to merge transformations)
    const { transformations, dispatch } = this.props;

    const dependentDatasetIds = transformations
      .filter(transformation => transformation.get('op') === 'core/merge-datasets')
      .map(transformation => transformation.getIn(['args', 'source', 'datasetId']))
      .toSet();

    Promise.all(
      dependentDatasetIds.map(id => dispatch(ensureDatasetFullyLoaded(id)))
    ).then((dependentDatasets) => {
      const indexedById = dependentDatasets.reduce(
        (index, dataset) => Object.assign({}, index, { [dataset.get('id')]: dataset }),
        {}
      );
      this.setState({ dependentDatasets: indexedById });
    });
  }

  render() {
    const { transformations, columns } = this.props;
    const { dependentDatasets } = this.state;
    return (
      <div
        className="TransformationList"
      >
        <ol>
          {transformations.map((transformation, index) => (
            <li key={index}>
              <TransformationListItem
                transformations={transformations}
                dependentDatasets={dependentDatasets}
                columns={columns}
                index={index}
              />
            </li>
          ))}
        </ol>
      </div>
    );
  }
}

TransformationList.propTypes = {
  transformations: PropTypes.object.isRequired,
  columns: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

// Inject dispatch only
const ConnectedTransformationList = connect()(TransformationList);

function markUndo(transformations, idx) {
  if (idx < 0) {
    return transformations;
  }
  if (transformations.getIn([idx, 'undo'])) {
    return markUndo(transformations, idx - 1);
  }
  return transformations.setIn([idx, 'undo'], true);
}

function transformationLog(persistedTransformations, pendingTransformations) {
  let allTransformations = persistedTransformations;
  pendingTransformations.forEach((pendingTransformation) => {
    if (pendingTransformation.get('op') === 'undo') {
      allTransformations = markUndo(allTransformations, allTransformations.size - 1);
    } else {
      allTransformations = allTransformations.push(pendingTransformation.set('pending', true));
    }
  });
  return allTransformations;
}

export default function TransformationLog({
  onClose,
  onUndo,
  transformations = Immutable.List(),
  columns,
  pendingTransformations,
  isLockedFromTransformations,
}) {
  const allTransformations = transformationLog(transformations, pendingTransformations);

  return (
    <div
      className="DataTableSidebar TransformationLog"
    >
      <SidebarHeader onClose={onClose}>
        <FormattedMessage id="transformation_log" />
      </SidebarHeader>
      <ConnectedTransformationList
        transformations={allTransformations}
        columns={columns}
      />
      <SidebarControls
        positiveButtonText={<FormattedMessage id="undo" />}
        onApply={
          (
            allTransformations.every(transformation => transformation.get('undo')) ||
            isLockedFromTransformations
          ) ? null : onUndo
        }
        onClose={onClose}
      />
    </div>
  );
}

TransformationLog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUndo: PropTypes.func.isRequired,
  transformations: PropTypes.object,
  columns: PropTypes.object.isRequired,
  pendingTransformations: PropTypes.object.isRequired,
  isLockedFromTransformations: PropTypes.bool,
};
