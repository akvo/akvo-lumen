// TODO dataset not fetched if navigate straight to page
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, intlShape } from 'react-intl';
import * as api from '../utilities/api';
import { ensureLibraryLoaded } from '../actions/library';
import { pollTxImportStatus, startTx, endTx, fetchDataset, fetchTextSortedDataset, fetchNumberSortedDataset } from '../actions/dataset';
import { showNotification } from '../actions/notification';
import MergeTransformation from '../components/transformation/MergeTransformation';
import ReverseGeocodeTransformation from '../components/transformation/ReverseGeocodeTransformation';
import DeriveCategoryTransformation from '../components/transformation/DeriveCategoryTransformation';
import { trackEvent } from '../utilities/analytics';
import { TRANSFORM_DATASET } from '../constants/analytics';
import './Transformation.scss';

const transformationComponent = {
  merge: MergeTransformation,
  'reverse-geocode': ReverseGeocodeTransformation,
  'derive-category': DeriveCategoryTransformation,
};

class Transformation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      transforming: false,
    };
  }

  componentWillMount() {
    this.props.dispatch(ensureLibraryLoaded())
      .then(() => this.setState({ loading: false }));
  }

  handleApplyTransformation(transformation) {
    trackEvent(TRANSFORM_DATASET, transformation.op);
    const { dispatch, datasetId, router } = this.props;
    this.setState({ transforming: true });
    dispatch(showNotification('info', 'Applying transformation...'));

    dispatch(startTx(datasetId));

    api.post(`/api/transformations/${datasetId}/transform/${transformation.op}`, transformation)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to merge dataset');
        } else {
          dispatch(pollTxImportStatus(response.body.jobExecutionId, () => {
            this.setState({ transforming: false });
            dispatch(showNotification('info', 'Transformation success', true));
            router.push(`/dataset/${datasetId}`);
            dispatch(endTx(datasetId));
          }));
        }
      }).catch((err) => {
        this.setState({ transforming: false });
        dispatch(showNotification('error', `Transformation failed: ${err.message}`));
        const DONT_SHOW_SUCCESS_NOTIF = false;
        dispatch(endTx(datasetId, DONT_SHOW_SUCCESS_NOTIF));
      });
  }

  render() {
    const { loading, transforming } = this.state;
    if (loading) return null;

    const { datasetId, datasets, routeParams, intl } = this.props;
    const TransformationComponent = transformationComponent[routeParams.transformationType];

    return (
      <div className="Transformation">
        <TransformationComponent
          intl={intl}
          transforming={transforming}
          datasetId={datasetId}
          datasets={datasets}
          onApplyTransformation={transformation => this.handleApplyTransformation(transformation)}
          onFetchDataset={(id) => {
            this.props.dispatch(fetchDataset(id));
          }}
          onFetchSortedDataset={(id, columnName, columnType) => {
            if (columnType === 'text') {
              this.props.dispatch(fetchTextSortedDataset(id, columnName));
            } else {
              this.props.dispatch(fetchNumberSortedDataset(id, columnName));
            }
          }}
          onAlert={(alert) => {
            this.props.dispatch(alert);
          }}
        />
      </div>
    );
  }
}

Transformation.propTypes = {
  router: PropTypes.object.isRequired,
  routeParams: PropTypes.object.isRequired,
  datasets: PropTypes.object,
  datasetId: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
  intl: intlShape,
};

function mapStateToProps(state, props) {
  return {
    datasets: state.library.datasets,
    datasetId: props.params.datasetId,
  };
}

export default connect(mapStateToProps)(withRouter(injectIntl(Transformation)));
