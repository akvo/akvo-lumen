import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import { intlShape } from 'react-intl';
import { ensureDatasetFullyLoaded } from '../../../actions/dataset';
import SelectDataset from '../merge/SelectDataset';
import SelectMenu from '../../common/SelectMenu';
import { findColumnI, filterColumns, columnSelectOptions, columnSelectSelectedOption } from '../../../utilities/column';


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
    onChangeSpec(
        spec.setIn(['source', 'datasetId'], dataset.get('id'))
    );
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
      intl,
    } = this.props;

    const datasetId = spec.getIn(['source', 'datasetId']);
    const columns = datasets[datasetId] && datasets[datasetId].get('columns');
    const geoshapeColumns = columns ? filterColumns(datasets[datasetId].get('columns'), ['geoshape']) : [];

    const textColumns = columns ? filterColumns(datasets[datasetId].get('columns'), ['text']) : [];
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
            <SelectMenu
              options={columnSelectOptions(intl, geoshapeColumns)}
              onChange={column => onChangeSpec(spec.setIn(['source', 'geoshapeColumn'], column))}
              value={columnSelectSelectedOption(spec.getIn(['source', 'geoshapeColumn']), geoshapeColumns)}
            />
            <h1>Text column</h1>
            <SelectMenu
              options={columnSelectOptions(intl, textColumns)}
              onChange={column => this.handleSelectMergeColumn(findColumnI(textColumns, column))}
              value={columnSelectSelectedOption(spec.getIn(['source', 'mergeColumn', 'columnName']), textColumns)}
            />
            <h1>New column title</h1>
            <input
              type="text"
              onChange={evt => onChangeSpec(spec.setIn(['target', 'title'], evt.target.value))}
              value={spec.getIn(['target', 'title'])}
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
  intl: intlShape,
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
      intl,
    } = this.props;

    return (
      <div className="SourceReverseGeocodeOptions">
        <CustomDatasetOptions
          datasets={datasets}
          spec={spec}
          intl={intl}
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
  intl: intlShape,
};
