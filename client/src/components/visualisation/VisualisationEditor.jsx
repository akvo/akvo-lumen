import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { cloneDeep, get } from 'lodash';
import { connect } from 'react-redux';

import VisualisationConfig from './configMenu/VisualisationConfig';
import VisualisationPreview from './VisualisationPreview';
import { checkUndefined } from '../../utilities/utils';
import { specIsValidForApi, getNeedNewAggregation } from '../../utilities/aggregation';
import * as api from '../../utilities/api';
import { showNotification } from '../../actions/notification';

require('./VisualisationEditor.scss');

class VisualisationEditor extends Component {

  constructor(props) {
    super(props);
    this.state = {
      visualisation: null,
      metadata: { layerGroupId: '', layerMetadata: [] },
    };
    this.fetchAggregatedData = this.fetchAggregatedData.bind(this);
  }

  componentDidMount() {
    const { visualisation, specValid, needNewAggregation } = this.state;
    if ((visualisation.datasetId || visualisation.visualisationType === 'map') && specValid && needNewAggregation) {
      this.fetchAggregatedData(visualisation);
    }
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevProps, prevState) {
    const { visualisation, specValid } = this.state;
    if ((visualisation.datasetId || visualisation.visualisationType === 'map') && specValid && this.state.needNewAggregation) {
      this.fetchAggregatedData(visualisation);
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const nextPropsVisualisation = nextProps.visualisation;
    const nextPropsVType = nextPropsVisualisation.visualisationType;
    const visTypeHasChanged = nextPropsVType !== get(prevState, 'visualisation.visualisationType');
    let newState = { specValid: null, needNewAggregation: null };

    switch (nextPropsVType) {
      case null:
        // Data aggregated client-side
        newState = { visualisation: nextPropsVisualisation };
        break;
      case 'map':
        newState.specValid = specIsValidForApi(nextPropsVisualisation.spec, nextPropsVType);
        newState.needNewAggregation =
          Boolean(
            nextPropsVisualisation.spec.layers &&
              nextPropsVisualisation.spec.layers.length &&
              nextPropsVisualisation.spec.layers.some((layer, idx) =>
                                                      getNeedNewAggregation(
                                                        layer,
                                                        checkUndefined(prevState.lastVisualisationRequested, 'spec', 'layers', idx),
                                                        'map'
                                                      )
                                                    )
          )
          ||
          Boolean(
            checkUndefined(nextPropsVisualisation, 'spec', 'layers', 'length') !==
              checkUndefined(prevState.lastVisualisationRequested, 'spec', 'layers', 'length')
          );

        if (!prevState.visualisation || visTypeHasChanged) {
          // Update immediately, without waiting for the api call
          newState.visualisation = nextPropsVisualisation;
        }

        if (checkUndefined(nextPropsVisualisation, 'spec', 'layers', 'length') === 0) {
          // Normally, the new metadata api response overwrites the old one, but when length is
          // zero, there is no new metadata api respnonse. We need to manually set it to empty
          newState.lastVisualisationRequested = nextPropsVisualisation;
          newState.visualisation = nextPropsVisualisation;
          newState.metadata = {};
        }
        if (newState.needNewAggregation && newState.specValid) {
          newState.visualisation = nextPropsVisualisation;
          newState.lastVisualisationRequested = cloneDeep(nextPropsVisualisation);
        } else if (newState.specValid) {
          newState.visualisation = nextPropsVisualisation;
        }

        break;

      case 'pivot table':
      case 'pie':
      case 'polararea':
      case 'donut':
      case 'line':
      case 'area':
      case 'bubble':
      case 'bar':
      case 'scatter': {
        // Data aggregated on the backend for these types
        newState.specValid = specIsValidForApi(nextPropsVisualisation.spec, nextPropsVType);
        newState.needNewAggregation =
          getNeedNewAggregation(nextPropsVisualisation, prevState.lastVisualisationRequested);
        const currentData = get(prevState, 'visualisation.data');
        const currentVType = get(prevState, 'visualisation.visualisationType');
        if (currentData && (nextPropsVType !== 'pivot table' || (currentVType && currentVType === nextPropsVType))) {
          nextPropsVisualisation.data = currentData;
        }
        newState.visualisation = nextPropsVisualisation;
        newState.lastVisualisationRequested = cloneDeep(nextPropsVisualisation);
        break;
      }
      default: throw new Error(`Unknown visualisation type ${nextPropsVisualisation.visualisationType}`);
    }
    return newState;
  }

  fetchAggregatedData(visualisation) {
    const { spec, datasetId } = visualisation;
    const vType = visualisation.visualisationType;
    const requestId = Math.random();
    this.latestRequestId = requestId;

    const setMapVisualisationError = () => {
      this.setState({
        visualisation: {
          ...visualisation,
          awaitingResponse: false,
          failedToLoad: true,
        },
      });
    };

    const updateMapVisualisation = (metadata) => {
      this.setState({
        visualisation: {
          ...visualisation,
          awaitingResponse: false,
          failedToLoad: false,
        },
        metadata,
      });
    };

    const updateMapIfSuccess = (response) => {
      if (response.status >= 200 && response.status < 300) {
        updateMapVisualisation(response.body);
      } else {
        setMapVisualisationError();
      }
    };

    if (vType === 'map') {
      this.setState({ visualisation: { ...visualisation, awaitingResponse: true } });
      api
        .post('/api/visualisations/maps', visualisation)
        .then((response) => {
          updateMapIfSuccess(response);
        })
        .catch(() => {
          setMapVisualisationError();
        });
    } else {
      const VIS_TYPE_TO_AGGR_ENDPOINT_NAME = {
        'pivot table': 'pivot',
        pie: 'pie',
        donut: 'pie',
        polararea: 'pie',
        line: 'line',
        area: 'line',
        bar: 'bar',
        scatter: 'scatter',
        bubble: 'bubble',
      };
      api
        .get(`/api/aggregation/${datasetId}/${VIS_TYPE_TO_AGGR_ENDPOINT_NAME[vType]}`, {
          query: JSON.stringify(spec),
        })
        .then(({ body }) => {
          if (requestId === this.latestRequestId) {
            this.setState({
              visualisation: Object.assign({}, visualisation, { data: body }),
            });
          }
        })
        .catch((error) => {
          this.props.dispatch(showNotification('error', error.message));
        });
    }
  }

  render() {
    const { props } = this;
    const { metadata } = this.state;
    const visualisationToRender = this.state.visualisation; // most recent version that is valid
    const visualisation = props.visualisation; // up-to-date visualisation (may be unrenderable)

    return (
      <div
        className={`VisualisationEditor ${props.exporting ? 'VisualisationEditor--exporting' : ''}`}
      >
        {!props.exporting && (
          <VisualisationConfig
            visualisation={visualisation}
            metadata={metadata}
            datasets={props.datasets}
            rasters={props.rasters}
            onChangeVisualisationType={props.onChangeVisualisationType}
            onChangeSourceDataset={props.onChangeSourceDataset}
            onChangeVisualisationSpec={props.onChangeVisualisationSpec}
            onSaveVisualisation={props.onSaveVisualisation}
            loadDataset={props.loadDataset}
            env={props.env}
          />
        )}
        { visualisationToRender && <VisualisationPreview
          visualisation={visualisationToRender}
          metadata={metadata}
          datasets={props.datasets}
          onChangeVisualisationSpec={props.onChangeVisualisationSpec}
          width={props.exporting ? 1000 : undefined}
          height={props.exporting ? 600 : undefined}
          exporting={props.exporting}
        />}
      </div>
    );
  }
}

VisualisationEditor.propTypes = {
  visualisation: PropTypes.object.isRequired,
  env: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeVisualisationSpec: PropTypes.func.isRequired,
  onSaveVisualisation: PropTypes.func.isRequired,
  loadDataset: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  exporting: PropTypes.bool,
};

export default connect()(VisualisationEditor);
