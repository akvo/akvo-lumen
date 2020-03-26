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
    this.handleProps = this.handleProps.bind(this);
    this.fetchAggregatedData = this.fetchAggregatedData.bind(this);
    window.state = this.state;
  }

  componentDidMount() {
    this.handleProps(this.props);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.handleProps(nextProps);
  }

  handleProps(props) {
    const { visualisation } = props;
    const vType = visualisation.visualisationType;
    let specValid;
    let needNewAggregation;
    const visTypeHasChanged = vType !== get(this.state, 'visualisation.visualisationType');

    switch (vType) {
      case null:
        // Data aggregated client-side
        this.setState({ visualisation });
        break;

      case 'map':
        specValid = specIsValidForApi(visualisation.spec, vType);
        needNewAggregation =
          Boolean(
            visualisation.spec.layers &&
            visualisation.spec.layers.length &&
            visualisation.spec.layers.some((layer, idx) =>
              getNeedNewAggregation(
                layer,
                checkUndefined(this.lastVisualisationRequested, 'spec', 'layers', idx),
                'map'
              )
            )
          )
          ||
          Boolean(
            checkUndefined(visualisation, 'spec', 'layers', 'length') !==
            checkUndefined(this.lastVisualisationRequested, 'spec', 'layers', 'length')
          );

        if (!this.state.visualisation || visTypeHasChanged) {
          // Update immediately, without waiting for the api call
          this.setState({ visualisation: { ...visualisation } });
        }

        if (checkUndefined(visualisation, 'spec', 'layers', 'length') === 0) {
          // Normally, the new metadata api response overwrites the old one, but when length is
          // zero, there is no new metadata api respnonse. We need to manually set it to empty
          this.lastVisualisationRequested = null;
          this.setState({
            visualisation: { ...visualisation },
            metadata: {},
          });
        }

        if (needNewAggregation && specValid) {
          this.fetchAggregatedData(visualisation);
          this.lastVisualisationRequested = cloneDeep(visualisation);
        } else if (specValid) {
          // setState to update non-aggregated properties e.g. baselayer
          this.setState({ visualisation: { ...visualisation } });
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

        specValid = specIsValidForApi(visualisation.spec, vType);
        needNewAggregation = getNeedNewAggregation(visualisation, this.lastVisualisationRequested);

        const newVisualisation = { ...visualisation };
        const data = get(this, 'state.visualisation.data');
        const currentVType = get(this.props, 'visualisation.visualisationType');
        if (data && (vType !== 'pivot table' || (currentVType && currentVType === vType))) {
          newVisualisation.data = data;
        }
        this.setState({ visualisation: newVisualisation });

        if (visualisation.datasetId && specValid && needNewAggregation) {
          this.fetchAggregatedData(visualisation);
          // Store a copy of this visualisation to compare against on next update
          this.lastVisualisationRequested = cloneDeep(visualisation);
        }

        this.forceUpdate();
        break;
      }
      default: throw new Error(`Unknown visualisation type ${visualisation.visualisationType}`);
    }
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
