import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import update from 'react-addons-update';
import { isEmpty } from 'lodash';
import ShareEntity from '../components/modals/ShareEntity';
import * as actions from '../actions/visualisation';
import { fetchDataset } from '../actions/dataset';
import { fetchLibrary } from '../actions/library';
import genericSpecTemplate from './Visualisation/genericSpecTemplate';
import mapSpecTemplate from './Visualisation/mapSpecTemplate';

require('../styles/Visualisation.scss');

const updateAxisLabels = (vType, spec) => {
  let autoAxisLabelY = '';
  let autoAxisLabelX = '';

  switch (vType) {
    case 'bar':
      autoAxisLabelY = spec.metricColumnYName;
      autoAxisLabelX = spec.bucketColumn ? spec.bucketColumnName : autoAxisLabelX;

      if (spec.bucketColumn !== null) {
        autoAxisLabelY += ` - ${spec.metricAggregation}`;

        if (spec.truncateSize !== null) {
          let truncateOrderIndicator;

          if (spec.sort === 'asc') {
            truncateOrderIndicator = 'bottom';
          } else if (spec.sort === 'dsc') {
            truncateOrderIndicator = 'top';
          } else {
            truncateOrderIndicator = 'first';
          }

          autoAxisLabelX += ` - ${truncateOrderIndicator} ${spec.truncateSize}`;
        }
      }

      break;

    case 'line':
    case 'area':
      autoAxisLabelY = spec.metricColumnYName;
      if (spec.bucketColumn !== null) {
        autoAxisLabelY += ` - ${spec.metricAggregation}`;
      }

      if (spec.metricColumnX === null) {
        autoAxisLabelX = 'Dataset row number';
      } else {
        autoAxisLabelX = spec.metricColumnXName;
      }
      break;

    case 'scatter':
      autoAxisLabelY = spec.metricColumnYName;
      autoAxisLabelX = spec.metricColumnXName;

      if (spec.bucketColumn !== null) {
        autoAxisLabelY += ` - ${spec.metricAggregation}`;
        autoAxisLabelX += ` - ${spec.metricAggregation}`;
      }
      break;

    case 'pie':
    case 'map':
      // No axis labels for these visualisation types
      break;

    default:
      throw new Error(`Unknown visualisation type ${vType}`);
  }

  const axisLabelX = spec.axisLabelXFromUser ? spec.axisLabelX : autoAxisLabelX;
  const axisLabelY = spec.axisLabelYFromUser ? spec.axisLabelY : autoAxisLabelY;

  const out = Object.assign({}, spec, { axisLabelY, axisLabelX });

  return out;
};

class Visualisation extends Component {

  constructor() {
    super();
    this.state = {
      isShareModalVisible: false,
      isUnsavedChanges: false,
      visualisation: {
        type: 'visualisation',
        name: 'Untitled Chart',
        visualisationType: null,
        datasetId: null,
        spec: {},
      },
      asyncComponents: null,
    };

    this.onSave = this.onSave.bind(this);
    this.handleChangeVisualisationSpec = this.handleChangeVisualisationSpec.bind(this);
    this.handleChangeVisualisation = this.handleChangeVisualisation.bind(this);
    this.handleChangeSourceDataset = this.handleChangeSourceDataset.bind(this);
    this.handleChangeVisualisationTitle = this.handleChangeVisualisationTitle.bind(this);
    this.handleChangeVisualisationType = this.handleChangeVisualisationType.bind(this);
    this.handleVisualisationAction = this.handleVisualisationAction.bind(this);
    this.toggleShareVisualisation = this.toggleShareVisualisation.bind(this);
  }

  componentWillMount() {
    const { params, library, dispatch } = this.props;
    const visualisationId = params.visualisationId;
    const isEditingExistingVisualisation = visualisationId != null;

    // If this is route is accessed via a permalink we'll have to fetch the library,
    // where all the datasets are.
    if (isEmpty(library.datasets)) {
      dispatch(fetchLibrary());
    }

    if (isEditingExistingVisualisation) {
      const visualisation = library.visualisations[visualisationId];
      if (visualisation == null) {
        dispatch(actions.fetchVisualisation(visualisationId));
      } else {
        const datasetId = visualisation.datasetId;
        if (datasetId != null) {
          if (library.datasets[datasetId] == null ||
              library.datasets[datasetId].get('rows') == null) {
            dispatch(fetchDataset(datasetId));
          }
        }
        this.setState({
          visualisation,
          isUnsavedChanges: false,
        });
      }
    }
  }

  componentDidMount() {
    require.ensure(['../components/charts/VisualisationViewer'], () => {
      require.ensure([], () => {
        /* eslint-disable global-require */
        const VisualisationHeader =
          require('../components/visualisation/VisualisationHeader').default;
        const VisualisationEditor =
          require('../components/visualisation/VisualisationEditor').default;
        require('../styles/Visualisation.scss');
        /* eslint-enable global-require */

        this.setState({
          asyncComponents: {
            VisualisationHeader,
            VisualisationEditor,
          },
        });
      }, 'Visualisation');
    }, 'VisualisationViewerPreload');
  }

  componentWillReceiveProps(nextProps) {
    /* If there is a visualisation to load from the library, and we haven't loaded it yet, load it
    /* from nextProps if it exists there */
    const visualisationId = this.props.params.visualisationId;
    const isEditingExistingVisualisation = visualisationId != null;
    const loadedVisualisation = this.state.visualisation.id != null;
    const nextPropsHasVisualisation = Boolean(nextProps.library.visualisations[visualisationId]);

    if (isEditingExistingVisualisation && !loadedVisualisation && nextPropsHasVisualisation) {
      this.setState({
        visualisation: nextProps.library.visualisations[visualisationId],
      });
    }
  }

  onSave() {
    const { dispatch } = this.props;
    this.setState({
      isUnsavedChanges: false,
    });
    if (this.state.visualisation.id) {
      dispatch(actions.saveVisualisationChanges(this.state.visualisation));
    } else {
      dispatch(actions.createVisualisation(this.state.visualisation));
    }
  }

  // Helper method for...
  handleChangeVisualisation(map) {
    const visualisation = Object.assign({}, this.state.visualisation, map);

    this.setState({
      visualisation,
      isUnsavedChanges: true,
    });
  }

  handleChangeVisualisationSpec(value) {
    const axisLabelUpdateTriggers = [
      'bucketColumn',
      'subBucketColumn',
      'truncateSize',
      'metricAggregation',
      'metricColumnY',
      'metricColumnX',
      'sort',
    ];

    const shouldUpdateAxisLabels = axisLabelUpdateTriggers.some(trigger =>
        Object.keys(value).some(key => key.toString() === trigger.toString())
    );

    let spec = update(this.state.visualisation.spec, { $merge: value });

    if (shouldUpdateAxisLabels) {
      spec = update(spec,
        { $merge: updateAxisLabels(this.state.visualisation.visualisationType, spec) });
    }

    const visualisation = Object.assign({}, this.state.visualisation, { spec });

    this.setState({
      isUnsavedChanges: true,
      visualisation,
    });
  }

  handleChangeVisualisationType(visualisationType) {
    let specTemplate;
    switch (visualisationType) {
      case 'map':
        specTemplate = Object.assign({}, mapSpecTemplate);
        break;

      case 'bar':
      case 'line':
      case 'area':
      case 'pie':
      case 'donut':
      case 'scatter':
        specTemplate = Object.assign({}, genericSpecTemplate);
        break;

      default:
        throw new Error(`Unknown visualisation type ${visualisationType}`);
    }
    this.handleChangeVisualisation({
      visualisationType,
      spec: specTemplate,
    });
  }

  handleChangeVisualisationTitle(event) {
    this.handleChangeVisualisation({ name: event.target.value });
  }

  handleChangeSourceDataset(datasetId) {
    if (!this.props.library.datasets[datasetId].get('columns')) {
      this.props.dispatch(fetchDataset(datasetId));
    }
    this.handleChangeVisualisation({ datasetId });
  }

  toggleShareVisualisation() {
    this.setState({
      isShareModalVisible: !this.state.isShareModalVisible,
    });
  }

  handleVisualisationAction(action) {
    switch (action) {
      case 'share':
        this.toggleShareVisualisation();
        break;
      default:
        throw new Error(`Action ${action} not yet implemented`);
    }
  }

  render() {
    if (this.state.visualisation == null || !this.state.asyncComponents) {
      return <div className="Visualisation">Loading...</div>;
    }
    const { VisualisationHeader, VisualisationEditor } = this.state.asyncComponents;
    const visualisation = this.state.visualisation;

    return (
      <div className="Visualisation">
        <VisualisationHeader
          isUnsavedChanges={this.state.isUnsavedChanges}
          visualisation={visualisation}
          onVisualisationAction={this.handleVisualisationAction}
        />
        <VisualisationEditor
          visualisation={visualisation}
          datasets={this.props.library.datasets}
          onChangeTitle={this.handleChangeVisualisationTitle}
          onChangeVisualisationType={this.handleChangeVisualisationType}
          onChangeSourceDataset={this.handleChangeSourceDataset}
          onChangeVisualisationSpec={this.handleChangeVisualisationSpec}
          onSaveVisualisation={this.onSave}
        />
        <ShareEntity
          isOpen={this.state.isShareModalVisible}
          onClose={this.toggleShareVisualisation}
          title={visualisation.name}
          id={visualisation.id}
          type={visualisation.type}
        />
      </div>
    );
  }
}

Visualisation.propTypes = {
  dispatch: PropTypes.func.isRequired,
  library: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
};

export default connect(state => state)(Visualisation);
