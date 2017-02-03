import React, { Component, PropTypes } from 'react';
import VisualisationConfig from './VisualisationConfig';
import VisualisationPreview from './VisualisationPreview';
import * as api from '../../api';

require('../../styles/VisualisationEditor.scss');

const specIsValid = (spec) => {
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
    this.fetchPivotData = this.fetchPivotData.bind(this);
    this.getVisualisation = this.getVisualisation.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ visualisation: this.getVisualisation(nextProps.visualisation) });
  }

  getVisualisation(visualisation) {
    switch (visualisation.visualisationType) {
      case null:
      case 'map':
      case 'bar':
      case 'line':
      case 'area':
      case 'pie':
      case 'donut':
      case 'scatter':
        return visualisation;

      case 'pivot table':
        this.fetchPivotData(visualisation.datasetId, visualisation.spec);
        return visualisation;

      default: throw new Error(`Unknown visualisation type ${visualisation.visualisationType}`);
    }
  }

  fetchPivotData(datasetId, spec) {
    if (datasetId && specIsValid(spec)) {
      const requestId = Math.random();
      this.latestRequestId = requestId;

      api.get(`/api/pivot/${datasetId}`, {
        query: JSON.stringify(spec),
      }).then((response) => {
        if (requestId === this.latestRequestId) {
          this.setState({
            visualisation: Object.assign({}, this.state.visualisation, { data: response }),
          });
        }
      });
    }
  }

  render() {
    const { props } = this;
    const visualisation = this.state.visualisation || this.props.visualisation;

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
      this.fetchPivotData(this.props.visualisation.datasetId, this.props.visualisation.spec);
    }
  }
*/
