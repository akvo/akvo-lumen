import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import { intlShape } from 'react-intl';
import TransformationHeader from './TransformationHeader';
import TargetReverseGeocodeOptions from './reverse-geocode/TargetReverseGeocodeOptions';
import SourceReverseGeocodeOptions from './reverse-geocode/SourceReverseGeocodeOptions';
import { ensureDatasetFullyLoaded } from '../../actions/dataset';

import './ReverseGeocodeTransformation.scss';

class ReverseGeocodeTransformation extends Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      spec: Immutable.fromJS({
        target: {
          geopointColumn: null,
          title: '',
        },
        source: {
          datasetId: null,
          geopointColumn: null,
          mergeColumn: null,
        },
      }),
    };
  }

  UNSAFE_componentWillMount() {
    const { dispatch, datasetId } = this.props;
    const { spec } = this.state;
    dispatch(ensureDatasetFullyLoaded(datasetId))
      .then(() => {
        const newSpec = spec.setIn(['target', 'geopointColumn'], this.targetGeopointColumns().first());
        this.setState({ loading: false, spec: newSpec });
      });
  }

  getSpec() {
    const { spec } = this.state;

    const source = spec.get('source') == null ? null : {
      datasetId: spec.getIn(['source', 'datasetId']),
      geoshapeColumn: spec.getIn(['source', 'geoshapeColumn', 'columnName']),
      mergeColumn: spec.getIn(['source', 'mergeColumn', 'columnName']),
    };

    return {
      op: 'core/reverse-geocode',
      args: {
        target: {
          geopointColumn: spec.getIn(['target', 'geopointColumn', 'columnName']),
          title: spec.getIn(['target', 'title']),
        },
        source,
      },
    };
  }

  isValidSpec() {
    const { args: { target, source } } = this.getSpec();

    const validTarget = target.geopointColumn != null && Boolean(target.title);
    const validSource = source == null ? false :
      source.datasetId != null && source.geoshapeColumn != null && source.mergeColumn != null;

    return validTarget && validSource;
  }

  targetGeopointColumns() {
    const { datasets, datasetId } = this.props;
    return datasets[datasetId]
      .get('columns')
      .filter(column => column.get('type') === 'geopoint');
  }

  handleChangeSpec(spec) {
    this.setState(Object.assign({}, this.state, { spec }));
  }

  render() {
    const { datasetId, datasets, onApplyTransformation, transforming, intl } = this.props;
    const { loading, spec } = this.state;
    if (loading) return null;

    return (
      <div className="ReverseGeocodeTransformation">
        <TransformationHeader
          datasetId={datasetId}
          isValidTransformation={this.isValidSpec() && !transforming}
          onApply={() => onApplyTransformation(this.getSpec())}
          buttonText="Apply"
          titleText="Reverse Geocode"
        />
        <div className="container">
          <TargetReverseGeocodeOptions
            intl={intl}
            dataset={datasets[datasetId]}
            spec={spec}
            onChangeSpec={s => this.handleChangeSpec(s)}
          />
          <div className="separator" />
          <SourceReverseGeocodeOptions
            datasets={datasets}
            intl={intl}
            spec={spec}
            onChangeSpec={s => this.handleChangeSpec(s)}
          />
        </div>
      </div>
    );
  }
}

ReverseGeocodeTransformation.propTypes = {
  datasets: PropTypes.object.isRequired,
  datasetId: PropTypes.string.isRequired,
  onApplyTransformation: PropTypes.func.isRequired,
  transforming: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
  intl: intlShape,
};

export default connect()(ReverseGeocodeTransformation);
