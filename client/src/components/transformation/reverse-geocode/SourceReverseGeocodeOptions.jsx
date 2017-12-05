import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import { ensureDatasetFullyLoaded } from '../../../actions/dataset';
import SelectDataset from '../merge/SelectDataset';
import SelectColumn from '../SelectColumn';

import './SourceReverseGeocodeOptions.scss';

const customDatasetSourceSpec = Immutable.fromJS({
  datasetId: null,
  geoshapeColumn: null,
  mergeColumn: null,
});

class WrappedCustomDatasetOptions extends Component {

  constructor(props) {
    super(props);

    this.state = {
      isLoadingDataset: false,
    };
  }

  handleSelectDataset(dataset) {
    const { spec, onChangeSpec, dispatch } = this.props;
    this.setState({ isLoadingDataset: true });
    dispatch(ensureDatasetFullyLoaded(dataset.get('id')))
      .then(() => this.setState({ isLoadingDataset: false }));
    /** Something to do with datasetId being null? */
    if (!spec.getIn('source', 'datasetId')) {
      onChangeSpec(
          spec.setIn(['source', 'datasetId'],
            dataset.get('id'))
      );
    }
  }

  handleSelectMergeColumn(column) {
    const { spec, onChangeSpec } = this.props;
    onChangeSpec(
      spec.setIn(['target', 'title'], column.get('title'))
          .setIn(['source', 'mergeColumn'], column)
    );
  }

  render() {
    const {
      datasets,
      spec,
      onChangeSpec,
    } = this.props;

    const datasetId = spec.getIn(['source', 'datasetId']);

    return (
      <div>
        <h1>Shape dataset</h1>
        <SelectDataset
          datasets={datasets}
          value={datasetId == null ? null : datasets[datasetId]}
          onChange={dataset => this.handleSelectDataset(dataset)}
        />
        {datasetId != null && !this.state.isLoadingDataset &&
          <div>
            <h1>Shape column</h1>
            <SelectColumn
              columns={datasets[datasetId].get('columns').filter(column => column.get('type') === 'geoshape')}
              onChange={column => onChangeSpec(spec.setIn(['source', 'geoshapeColumn'], column))}
              value={spec.getIn(['source', 'geoshapeColumn'])}
            />
            <h1>Text column</h1>
            <SelectColumn
              columns={datasets[datasetId].get('columns').filter(column => column.get('type') === 'text')}
              onChange={column => this.handleSelectMergeColumn(column)}
              value={spec.getIn(['source', 'mergeColumn'])}
            />
          </div>
        }
      </div>
    );
  }
}

WrappedCustomDatasetOptions.propTypes = {
  datasets: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
};

const CustomDatasetOptions = connect()(WrappedCustomDatasetOptions);

export default class SourceReverseGeocodeOptions extends Component {

  constructor(props) {
    super(props);

    this.state = { isCustomDataset: true };
  }

  handleToggleCustomDataset() {
    const { onChangeSpec, spec } = this.props;
    const { isCustomDataset } = this.state;
    onChangeSpec(isCustomDataset ? spec.delete('source') : spec.set('source', customDatasetSourceSpec));
    this.setState({ isCustomDataset: !isCustomDataset });
  }

  render() {
    const {
      datasets,
      spec,
      onChangeSpec,
    } = this.props;

    return (
      <div className="SourceReverseGeocodeOptions">
        <CustomDatasetOptions
          datasets={datasets}
          spec={spec}
          onChangeSpec={onChangeSpec}
        />
      </div>
    );
  }
}

SourceReverseGeocodeOptions.propTypes = {
  datasets: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};
