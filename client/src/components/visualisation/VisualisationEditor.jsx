import React, { Component, PropTypes } from 'react';
import VisualisationConfig from './VisualisationConfig';
import VisualisationPreview from './VisualisationPreview';
import * as api from '../../api';

require('../../styles/VisualisationEditor.scss');

const specIsValidForApi = (spec) => {
  if (spec.aggregation !== 'count' && spec.valueColumn == null) {
    return false;
  }

  return true;
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

    switch (vType) {
      case null:
      case 'map':
      case 'bar':
      case 'line':
      case 'area':
      case 'pie':
      case 'donut':
      case 'scatter':
        this.setState({ visualisation });
        break;

      case 'pivot table':
        if (!this.state.visualisation || !this.state.visualisation.datasetId) {
          // Update immediately, without waiting for the api call
          this.setState({ visualisation });
        } else if (!specIsValidForApi(visualisation.spec)) {
          this.setState({
            visualisation: Object.assign({},
              visualisation, { data: this.state.visualisation.data }),
          });
        }
        if (visualisation.datasetId && specIsValidForApi(visualisation.spec)) {
          const lastSpec = this.lastPivotRequested && this.lastPivotRequested.spec ?
            this.lastPivotRequested.spec : {};
          const lastDataset = this.lastPivotRequested ?
            this.lastPivotRequested.datasetId : null;
          const spec = visualisation.spec;

          // Only fetch new aggregated data if a relevant part of the spec has changed
          const shouldRequestNewData = Boolean(
            visualisation.datasetId !== lastDataset ||
            spec.aggregation !== lastSpec.aggregation ||
            spec.valueColumn !== lastSpec.valueColumn ||
            spec.categoryColumn !== lastSpec.categoryColumn ||
            spec.rowColumn !== lastSpec.rowColumn
          );
          if (shouldRequestNewData) {
            this.fetchAggregatedData(visualisation);
          } else {
            // Update children without requesting new aggregated data
            this.setState({
              visualisation:
                Object.assign({}, visualisation, { data: this.state.visualisation.data }),
            });
          }

          // Store a copy of this visualisation to compare against on next update
          this.lastPivotRequested = Object.assign({}, visualisation);
        }
        break;

      default: throw new Error(`Unknown visualisation type ${visualisation.visualisationType}`);
    }
  }

  fetchAggregatedData(visualisation) {
    const { spec, datasetId } = visualisation;
    const requestId = Math.random();
    this.latestRequestId = requestId;

    api.get(`/api/pivot/${datasetId}`, {
      query: JSON.stringify(spec),
    }).then((response) => {
      if (requestId === this.latestRequestId) {
        this.setState({
          visualisation: Object.assign({}, visualisation, { data: response }),
        });
      }
    });
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
