import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEqual, cloneDeep } from 'lodash';
import VisualisationConfig from './VisualisationConfig';
import VisualisationPreview from './VisualisationPreview';
import * as api from '../../api';

require('../../styles/VisualisationEditor.scss');

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

    default:
      return false;
  }
  return true;
};

const getNeedNewAggregation = (newV, oldV = { spec: {} }) => {
  const vType = newV.visualisationType;

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

    default:
      throw new Error(`Unknown visualisation type ${vType} supplied to getNeedNewAggregation`);
  }
};

export default class VisualisationEditor extends Component {

  constructor() {
    super();
    this.state = {
      visualisation: null,
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
      case 'map':
      case 'bar':
      case 'line':
      case 'area':
      case 'scatter':
        // Data aggregated client-side
        this.setState({ visualisation });
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

    switch (vType) {
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
    const visualisation = this.state.visualisation;

    return (
      <div className="VisualisationEditor">
        <VisualisationConfig
          visualisation={visualisation}
          datasets={props.datasets}
          onChangeVisualisationType={props.onChangeVisualisationType}
          onChangeSourceDataset={props.onChangeSourceDataset}
          onChangeVisualisationSpec={props.onChangeVisualisationSpec}
          onSaveVisualisation={props.onSaveVisualisation}
        />
        <VisualisationPreview
          visualisation={visualisation}
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
};

/*
  componentDidMount() {
    if (this.props.visualisation.datasetId) {
      this.fetchAggregatedData(this.props.visualisation.datasetId, this.props.visualisation.spec);
    }
  }
*/
