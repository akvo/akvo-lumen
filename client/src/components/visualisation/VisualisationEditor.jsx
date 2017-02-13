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
        if (!this.state.visualisation) {
          this.setState({ visualisation });
        }
        if (visualisation.datasetId && specIsValid(visualisation.spec)) {
          this.fetchAggregatedData(visualisation);
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
