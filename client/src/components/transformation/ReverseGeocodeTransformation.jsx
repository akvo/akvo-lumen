import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import TransformationHeader from './TransformationHeader';
import SelectColumn from './SelectColumn';
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
          title: 'Administrative level 2',
        },
        // null means table "world" table and adm2 level
        source: null,
        // {
        //   datasetId: null,
        //   geopointColumnName: null,
        //   columnName: null, // Column name containing the "text"
        // }
      }),
    };
  }

  componentWillMount() {
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
    return {
      op: 'core/reverse-geocode',
      args: {
        target: {
          geopointColumn: spec.getIn(['target', 'geopointColumn', 'columnName']),
          title: spec.getIn(['target', 'title']),
        },
        source: null,
      },
    };
  }

  isValidSpec() {
    const { args: { target } } = this.getSpec();

    return target.geopointColumn != null && target.title != null;
  }

  targetGeopointColumns() {
    const { datasets, datasetId } = this.props;
    return datasets[datasetId]
      .get('columns')
      .filter(column => column.get('type') === 'geopoint');
  }

  handleChangeGeopointColumn(column) {
    const newSpec = this.state.spec.setIn(['target', 'geopointColumn'], column);
    this.setState(Object.assign({}, this.state, { spec: newSpec }));
  }

  handleChangeColumnTitle(title) {
    const newSpec = this.state.spec.setIn(['target', 'title'], title);
    this.setState(Object.assign({}, this.state, { spec: newSpec }));
  }

  render() {
    const { datasetId, /* datasets,*/ onApplyTransformation, transforming } = this.props;
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
          <div>
            <h1>Geopoint column</h1>
            <SelectColumn
              columns={this.targetGeopointColumns()}
              onChange={column => this.handleChangeGeopointColumn(column)}
              value={spec.getIn(['target', 'geopointColumn'])}
            />
            <h1>New column title</h1>
            <input
              type="text"
              onChange={evt => this.handleChangeColumnTitle(evt.target.value)}
              value={spec.getIn(['target', 'title'])}
            />
          </div>
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
};

export default connect()(ReverseGeocodeTransformation);
