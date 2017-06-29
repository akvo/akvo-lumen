import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { isEmpty, cloneDeep } from 'lodash';
import ShareEntity from '../components/modals/ShareEntity';
import * as actions from '../actions/dashboard';
import * as api from '../api';
import { fetchLibrary } from '../actions/library';
import { fetchDataset } from '../actions/dataset';
import aggregationOnlyVisualisationTypes from '../utilities/aggregationOnlyVisualisationTypes';

const getEditingStatus = (location) => {
  const testString = 'create';

  return location.pathname.indexOf(testString) === -1;
};

const getLayoutObjectFromArray = (arr) => {
  const object = {};

  arr.forEach((item) => {
    const key = item.i;

    object[key] = item;
  });

  return object;
};

/* Get a pure representation of a dashboard from the container state */
const getDashboardFromState = (stateDashboard, isForEditor) => {
  const chosenLayoutRepresentation = isForEditor ?
        stateDashboard.layout : getLayoutObjectFromArray(stateDashboard.layout);

  const dashboard = Object.assign({}, stateDashboard, { layout: chosenLayoutRepresentation });

  return dashboard;
};

class Dashboard extends Component {

  constructor() {
    super();
    this.state = {
      dashboard: {
        type: 'dashboard',
        title: '',
        entities: {},
        layout: [],
        id: null,
        created: null,
        modified: null,
      },
      isSavePending: null,
      isUnsavedChanges: null,
      isShareModalVisible: false,
      requestedDatasetIds: [],
      asyncComponents: null,
      aggregatedDatasets: {},
    };
    this.loadDashboardIntoState = this.loadDashboardIntoState.bind(this);
    this.onAddVisualisation = this.onAddVisualisation.bind(this);
    this.updateLayout = this.updateLayout.bind(this);
    this.updateEntities = this.updateEntities.bind(this);
    this.onUpdateName = this.onUpdateName.bind(this);
    this.onSave = this.onSave.bind(this);
    this.toggleShareDashboard = this.toggleShareDashboard.bind(this);
    this.handleDashboardAction = this.handleDashboardAction.bind(this);
    this.addDataToVisualisations = this.addDataToVisualisations.bind(this);
  }

  componentWillMount() {
    const isEditingExistingDashboard = getEditingStatus(this.props.location);
    const isLibraryLoaded = !isEmpty(this.props.library.datasets);

    if (!isLibraryLoaded) {
      this.props.dispatch(fetchLibrary());
    }

    if (isEditingExistingDashboard) {
      const dashboardId = this.props.params.dashboardId;
      const existingDashboardLoaded =
        isLibraryLoaded && !isEmpty(this.props.library.dashboards[dashboardId].layout);

      if (!existingDashboardLoaded) {
        this.props.dispatch(actions.fetchDashboard(dashboardId));
      } else {
        this.loadDashboardIntoState(this.props.library.dashboards[dashboardId], this.props.library);
      }
    }
  }

  componentDidMount() {
    require.ensure(['../components/charts/VisualisationViewer'], () => {
      require.ensure([], () => {
        /* eslint-disable global-require */
        const DashboardEditor = require('../components/dashboard/DashboardEditor').default;
        const DashboardHeader = require('../components/dashboard/DashboardHeader').default;
        /* eslint-enable global-require */

        this.setState({
          asyncComponents: {
            DashboardEditor,
            DashboardHeader,
          },
        });
      }, 'Dashboard');
    }, 'VisualisationViewerPreload');
  }

  componentWillReceiveProps(nextProps) {
    const isEditingExistingDashboard = getEditingStatus(this.props.location);
    const dashboardAlreadyLoaded = this.state.dashboard.layout.length !== 0;

    if (isEditingExistingDashboard && !dashboardAlreadyLoaded) {
      /* We need to load a dashboard, and we haven't loaded it yet. Check if nextProps has both i)
      /* the dashboard and ii) the visualisations the dashboard contains, then load the dashboard
      /* editor if both these conditions are true. */

      const dash = nextProps.library.dashboards[nextProps.params.dashboardId];
      const haveDashboardData = Boolean(dash && dash.layout);

      if (haveDashboardData) {
        const dashboardEntities = Object.keys(dash.entities).map(key => dash.entities[key]);
        const dashboardHasVisualisations =
          dashboardEntities.some(entity => entity.type === 'visualisation');
        const libraryHasVisualisations = !isEmpty(nextProps.library.visualisations);

        if (dashboardHasVisualisations && !libraryHasVisualisations) {
          /* We don't yet have the visualisations necessary to display this dashboard. Do nothing.
          /* When the library API call returns and the visualisaitons are loaded,
          /* componentWillReceiveProps will be called again. */
          return;
        }

        this.loadDashboardIntoState(dash, nextProps.library);
      }
    }

    if (!this.props.params.dashboardId && nextProps.params.dashboardId) {
      const dashboardId = nextProps.params.dashboardId;

      this.setState({
        isSavePending: false,
        isUnsavedChanges: false,
        dashboard: Object.assign({}, this.state.dashboard, { id: dashboardId }),
      });
    }
  }

  onSave() {
    const { dispatch } = this.props;
    const dashboard = getDashboardFromState(this.state.dashboard, false);
    const isEditingExistingDashboard = getEditingStatus(this.props.location);

    if (isEditingExistingDashboard) {
      dispatch(actions.saveDashboardChanges(dashboard));

      // We should really check the save was successful, but for now let's assume it was
      this.setState({
        isUnsavedChanges: false,
      });
    } else if (!this.state.isSavePending) {
      this.setState({ isSavePending: true });
      dispatch(actions.createDashboard(dashboard));
    } else {
      // Ignore save request until the first "create dashboard" request succeeeds
    }
  }

  onAddVisualisation(visualisation) {
    const { id, datasetId, spec } = visualisation;
    const vType = visualisation.visualisationType;

    if (aggregationOnlyVisualisationTypes.find(item => item === vType)) {
      /* Only fetch the aggregated data */
      let aggType;

      switch (vType) {
        case 'pie':
        case 'donut':
          aggType = 'pie';
          break;
        case 'pivot table':
          aggType = 'pivot';
          break;
        default:
          break;
      }

      api.get(`/api/aggregation/${datasetId}/${aggType}`, {
        query: JSON.stringify(spec),
      }).then(response => response.json()).then((response) => {
        const change = {};
        change[id] = response;
        const aggregatedDatasets = Object.assign({}, this.state.aggregatedDatasets, change);
        this.setState({ aggregatedDatasets });
      });
    } else {
      /* Fetch the whole dataset */
      const datasetLoaded = this.props.library.datasets[datasetId].columns;
      const datasetRequested = this.state.requestedDatasetIds.some(dId => dId === datasetId);

      if (!datasetLoaded && !datasetRequested) {
        const newRequestedDatasetIds = this.state.requestedDatasetIds.slice(0);

        newRequestedDatasetIds.push(datasetId);
        this.setState({
          requestedDatasetIds: newRequestedDatasetIds,
        });
        this.props.dispatch(fetchDataset(datasetId));
      }
    }
  }

  onUpdateName(title) {
    const dashboard = Object.assign({}, this.state.dashboard, { title });
    this.setState({
      dashboard,
      isUnsavedChanges: true,
    });
  }

  updateLayout(layout) {
    const clonedLayout = cloneDeep(layout);
    const dashboard = Object.assign({}, this.state.dashboard, { layout: clonedLayout });
    const oldLayout = this.state.dashboard.layout;
    const layoutChanged = layout.some((item) => {
      const oldItem = oldLayout.find(oi => oi.i === item.i);

      if (oldItem === undefined) {
        return true;
      }

      const positionChanged = Boolean(oldItem.w !== item.w ||
        oldItem.h !== item.h ||
        oldItem.x !== item.x ||
        oldItem.y !== item.y);

      if (positionChanged) {
        return true;
      }

      return false;
    });

    this.setState({
      dashboard,
      isUnsavedChanges: layoutChanged ? true : this.state.isUnsavedChanges,
    });
  }

  updateEntities(entities) {
    const dashboard = Object.assign({}, this.state.dashboard, { entities });
    this.setState({
      dashboard,
      isUnsavedChanges: true,
    });
  }

  handleDashboardAction(action) {
    switch (action) {
      case 'share':
        this.toggleShareDashboard();
        break;
      default:
        throw new Error(`Action ${action} not yet implemented`);
    }
  }

  toggleShareDashboard() {
    this.setState({
      isShareModalVisible: !this.state.isShareModalVisible,
    });
  }

  loadDashboardIntoState(dash, library) {
    /* Put the dashboard into component state so it is fed to the DashboardEditor */
    const dashboard = Object.assign({}, dash,
      { layout: Object.keys(dash.layout).map(key => dash.layout[key]) }
    );
    this.setState({ dashboard });

    /* Load each unique dataset referenced by visualisations in the dashboard. Note - Even though
    /* onAddVisualisation also checks to see if a datasetId has already been requested, setState is
    /* not synchronous and is too slow here, hence the extra check */
    const requestedDatasetIds = this.state.requestedDatasetIds.slice(0);

    Object.keys(dash.entities).forEach((key) => {
      const entity = dash.entities[key];
      const isVisualisation = entity.type === 'visualisation';

      if (isVisualisation) {
        const visualisation = library.visualisations[key];

        if (aggregationOnlyVisualisationTypes.some(type =>
          type === visualisation.visualisationType)) {
          const alreadyProcessed = Boolean(visualisation.data);

          if (!alreadyProcessed) {
            this.onAddVisualisation(visualisation);
          }
        } else {
          const datasetId = visualisation.datasetId;
          const alreadyProcessed = requestedDatasetIds.some(id => id === datasetId);

          if (!alreadyProcessed) {
            requestedDatasetIds.push(datasetId);
            this.onAddVisualisation(visualisation);
          }
        }
      }
    });
  }

  addDataToVisualisations(visualisations) {
    const out = {};

    Object.keys(visualisations).forEach((key) => {
      if (this.state.aggregatedDatasets[key]) {
        out[key] = Object.assign(
          {},
          visualisations[key],
          { data: this.state.aggregatedDatasets[key] }
        );
      } else {
        out[key] = visualisations[key];
      }
    });
    return out;
  }

  render() {
    if (!this.state.asyncComponents) {
      return <div className="loadingIndicator">Loading...</div>;
    }
    const { DashboardHeader, DashboardEditor } = this.state.asyncComponents;
    const dashboard = getDashboardFromState(this.state.dashboard, true);

    return (
      <div className="Dashboard">
        <DashboardHeader
          title={dashboard.title}
          isUnsavedChanges={this.state.isUnsavedChanges}
          onDashboardAction={this.handleDashboardAction}
          onChangeTitle={this.onUpdateName}
          onBeginEditTitle={() => this.setState({ isUnsavedChanges: true })}
        />
        <DashboardEditor
          dashboard={dashboard}
          datasets={this.props.library.datasets}
          visualisations={this.addDataToVisualisations(this.props.library.visualisations)}
          onAddVisualisation={this.onAddVisualisation}
          onSave={this.onSave}
          onUpdateLayout={this.updateLayout}
          onUpdateEntities={this.updateEntities}
          onUpdateName={this.onUpdateName}
        />
        <ShareEntity
          isOpen={this.state.isShareModalVisible}
          onClose={this.toggleShareDashboard}
          title={dashboard.title}
          id={dashboard.id}
          type={dashboard.type}
        />
      </div>
    );
  }
}

Dashboard.propTypes = {
  dispatch: PropTypes.func.isRequired,
  library: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
};

export default connect(state => state)(Dashboard);
