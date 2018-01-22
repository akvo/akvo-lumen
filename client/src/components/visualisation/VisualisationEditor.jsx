import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEqual, cloneDeep } from 'lodash';
import VisualisationConfig from './VisualisationConfig';
import VisualisationPreview from './VisualisationPreview';
import { checkUndefined } from '../../utilities/utils';
import * as api from '../../api';

require('./VisualisationEditor.scss');

const specIsValidForApi = (spec, vType) => {
  switch (vType) {
    case 'pivot table':
      if (spec.aggregation !== 'count' && spec.valueColumn == null) {
        return false;
      }
      break;
    case 'pie':
    case 'donut':
      if (spec.bucketColumn === null) {
        return false;
      }
      break;
    case 'map':
      if (spec.layers.length === 0) {
        return false;
      }
      if (spec.layers.some(
        layer => Boolean(!layer.geom && (!layer.latitude || !layer.longitude)))
      ) {
        return false;
      }
      break;
    default:
      return false;
  }
  return true;
};

const getNeedNewAggregation = (newV = { spec: {} }, oldV = { spec: {} }, optionalVizType) => {
  const vType = newV.visualisationType || optionalVizType;

  switch (vType) {
    case 'pivot table':
      return Boolean(
        newV.datasetId !== oldV.datasetId ||
        newV.spec.aggregation !== oldV.spec.aggregation ||
        newV.spec.valueColumn !== oldV.spec.valueColumn ||
        newV.spec.categoryColumn !== oldV.spec.categoryColumn ||
        newV.spec.rowColumn !== oldV.spec.rowColumn ||
        !isEqual(newV.spec.filters, oldV.spec.filters)
      );
    case 'pie':
    case 'donut':
      return Boolean(
        newV.datasetId !== oldV.datasetId ||
        newV.spec.bucketColumn !== oldV.spec.bucketColumn ||
        !isEqual(newV.spec.filters, oldV.spec.filters)
      );
    case 'map':
      return Boolean(
        newV.datasetId !== oldV.datasetId ||
        newV.aggregationDataset !== oldV.aggregationDataset ||
        newV.aggregationColumn !== oldV.aggregationColumn ||
        newV.aggregationGeomColumn !== oldV.aggregationGeomColumn ||
        newV.aggregationMethod !== oldV.aggregationMethod ||
        newV.shapeLabelColumn !== oldV.shapeLabelColumn ||
        newV.latitude !== oldV.latitude ||
        newV.longitude !== oldV.longitude ||
        newV.geom !== oldV.geom ||
        newV.pointColorColumn !== oldV.pointColorColumn ||
        newV.pointSize !== oldV.pointSize ||
        newV.gradientColor !== oldV.gradientColor ||
        !isEqual(newV.filters, oldV.filters) ||
        !isEqual(newV.popup, oldV.popup) ||
        !isEqual(newV.pointColorMapping, oldV.pointColorMapping)
      );
    default:
      throw new Error(`Unknown visualisation type ${vType} supplied to getNeedNewAggregation`);
  }
};

export default class VisualisationEditor extends Component {

  constructor() {
    super();
    this.state = {
      visualisation: null,
      metadata: { layerGroupId: '', layerMetadata: [] },
    };
    this.handleProps = this.handleProps.bind(this);
    this.fetchAggregatedData = this.fetchAggregatedData.bind(this);
  }

  componentWillMount() {
    this.handleProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.handleProps(nextProps);
  }

  handleProps(props) {
    const { visualisation } = props;
    const vType = visualisation.visualisationType;
    let specValid;
    let needNewAggregation;

    switch (vType) {
      case null:
      case 'bar':
      case 'line':
      case 'area':
      case 'scatter':
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

        if (!this.state.visualisation || !this.state.visualisation.datasetId) {
          // Update immediately, without waiting for the api call
          this.setState({ visualisation: Object.assign({}, visualisation) });
        }

        if (needNewAggregation && specValid) {
          this.fetchAggregatedData(visualisation);
          this.lastVisualisationRequested = cloneDeep(visualisation);
        } else {
          //
        }

        break;
      case 'pivot table':
      case 'pie':
      case 'donut':
        // Data aggregated on the backend for these types

        specValid = specIsValidForApi(visualisation.spec, vType);
        needNewAggregation = getNeedNewAggregation(visualisation, this.lastVisualisationRequested);

        if (!this.state.visualisation || !this.state.visualisation.datasetId) {
          // Update immediately, without waiting for the api call
          this.setState({ visualisation });
        } else if (!specValid || !needNewAggregation) {
          this.setState({
            visualisation: Object.assign({},
              visualisation, { data: this.state.visualisation.data }),
          });
        }

        if (visualisation.datasetId && specValid && needNewAggregation) {
          this.fetchAggregatedData(visualisation);

          // Store a copy of this visualisation to compare against on next update
          this.lastVisualisationRequested = cloneDeep(visualisation);
        }
        break;

      default: throw new Error(`Unknown visualisation type ${visualisation.visualisationType}`);
    }
  }

  fetchAggregatedData(visualisation) {
    const { spec, datasetId } = visualisation;
    const vType = visualisation.visualisationType;
    const requestId = Math.random();
    this.latestRequestId = requestId;

    const setMapVisualisationError = () => {
      this.setState(
        {
          visualisation:
            Object.assign(
              {},
              visualisation,
              {
                awaitingResponse: false,
                failedToLoad: true,
              }
            ),
        }
      );
    };

    const updateMapVisualisation = (metadata) => {
      this.setState({
        visualisation: Object.assign(
          {},
          visualisation,
          {
            awaitingResponse: false,
            failedToLoad: false,
          }
        ),
        metadata,
      });
    };

    const updateMapIfSuccess = (response) => {
      if (response.status >= 200 && response.status < 300) {
        response
          .json()
          .then(json => updateMapVisualisation(json));
      } else {
        setMapVisualisationError();
      }
    };

    switch (vType) {
      case 'map':
        this.setState(
          {
            visualisation:
              Object.assign(
                {},
                visualisation,
                {
                  awaitingResponse: true,
                }
              ),
          }
        );
        api.post('/api/visualisations/maps', visualisation)
          .then((response) => {
            updateMapIfSuccess(response);
          }).catch(() => {
            setMapVisualisationError();
          });
        break;
      case 'pivot table':
        api.get(`/api/aggregation/${datasetId}/pivot`, {
          query: JSON.stringify(spec),
        }).then(response => response.json())
          .then((response) => {
            if (requestId === this.latestRequestId) {
              this.setState({
                visualisation: Object.assign({}, visualisation, { data: response }),
              });
            }
          });
        break;
      case 'pie':
      case 'donut':
        api.get(`/api/aggregation/${datasetId}/pie`, {
          query: JSON.stringify(spec),
        }).then(response => response.json())
          .then((response) => {
            if (requestId === this.latestRequestId) {
              this.setState({
                visualisation: Object.assign({}, visualisation, { data: response }),
              });
            }
          });
        break;
      default:
        throw new Error(`Unknown visualisation type ${vType} supplied to fetchAggregatedData`);
    }
  }

  render() {
    const { props } = this;
    const { metadata } = this.state;
    const visualisationToRender = this.state.visualisation; // most recent version that is valid
    const visualisation = props.visualisation; // up-to-date visualisation (may be unrenderable)

    return (
      <div className="VisualisationEditor">
        <VisualisationConfig
          visualisation={visualisation}
          metadata={metadata}
          datasets={props.datasets}
          onChangeVisualisationType={props.onChangeVisualisationType}
          onChangeSourceDataset={props.onChangeSourceDataset}
          onChangeVisualisationSpec={props.onChangeVisualisationSpec}
          onSaveVisualisation={props.onSaveVisualisation}
          loadDataset={props.loadDataset}
        />
        <VisualisationPreview
          visualisation={visualisationToRender}
          metadata={metadata}
          datasets={props.datasets}
        />
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
};
