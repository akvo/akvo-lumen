import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { isEmpty, cloneDeep } from 'lodash';
import get from 'lodash/get';
import { intlShape, injectIntl } from 'react-intl';
import BodyClassName from 'react-body-classname';
import queryString from 'querystringify';

import ShareEntity from '../modals/ShareEntity';
import * as actions from '../../actions/dashboard';
import * as api from '../../utilities/api';
import { fetchLibrary } from '../../actions/library';
import { fetchDataset, fetchColumn } from '../../actions/dataset';
import { trackPageView, trackEvent } from '../../utilities/analytics';
import aggregationOnlyVisualisationTypes from '../../utilities/aggregationOnlyVisualisationTypes';
import LoadingSpinner from '../common/LoadingSpinner';
import { SAVE_COUNTDOWN_INTERVAL, SAVE_INITIAL_TIMEOUT } from '../../constants/time';
import NavigationPrompt from '../common/NavigationPrompt';
import { printShape } from '../../containers/PrintProvider';
import { specIsValidForApi } from '../../utilities/aggregation';
import {
  SHARE_DASHBOARD,
  EXPORT_DASHBOARD_PNG,
  EXPORT_DASHBOARD_PDF,
  DASHBOARD_FILTER_CHANGE,
} from '../../constants/analytics';
import { showNotification } from '../../actions/notification';

require('./Dashboard.scss');

const filteredDashboardCondition = () => queryString.parse(location.search)['filter-dashboard'] === '0';

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

  constructor(props) {
    super(props);
    this.state = {
      dashboard: {
        type: 'dashboard',
        title: props.intl.formatMessage({ id: 'untitled_dashboard' }),
        entities: {},
        filter: { datasetId: null, columns: [] },
        layout: [],
        id: null,
        created: null,
        modified: null,
        shareId: '',
      },
      fetchingDashboard: false,
      isSavePending: null,
      isUnsavedChanges: null,
      isShareModalVisible: false,
      requestedDatasetIds: [],
      asyncComponents: null,
      aggregatedDatasets: {},
      timeToNextSave: SAVE_INITIAL_TIMEOUT,
      timeFromPreviousSave: 0,
      tabSelected: 'visualisations',
    };
    this.loadDashboardIntoState = this.loadDashboardIntoState.bind(this);
    this.onAddVisualisation = this.onAddVisualisation.bind(this);
    this.updateLayout = this.updateLayout.bind(this);
    this.updateEntities = this.updateEntities.bind(this);
    this.onUpdateName = this.onUpdateName.bind(this);
    this.onApplyFilterValue = this.onApplyFilterValue.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onSaveFailure = this.onSaveFailure.bind(this);
    this.toggleShareDashboard = this.toggleShareDashboard.bind(this);
    this.handleDashboardAction = this.handleDashboardAction.bind(this);
    this.addDataToVisualisations = this.addDataToVisualisations.bind(this);
    this.handleFetchShareId = this.handleFetchShareId.bind(this);
    this.handleSetSharePassword = this.handleSetSharePassword.bind(this);
    this.handleToggleShareProtected = this.handleToggleShareProtected.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
    this.onFilterValueChange = this.onFilterValueChange.bind(this);
  }

  componentDidMount() {
    const isEditingExistingDashboard = getEditingStatus(this.props.location);
    const isLibraryLoaded = !isEmpty(this.props.library.datasets);

    if (!isLibraryLoaded) {
      this.props.dispatch(fetchLibrary());
    }
    const datasetCallback = d => () => {
      if (d.filter.columns.length > 0) {
        const calls = d.filter.columns.map(o =>
        this.props.dispatch(fetchColumn(d.filter.datasetId, o.column)));
        Promise.all(calls).then(() => this.setState({ fetchingDashboard: false }));
      } else {
        this.setState({ fetchingDashboard: false });
      }
    };
    if (isEditingExistingDashboard) {
      this.setState({ isUnsavedChanges: false });
      const dashboardId = this.props.params.dashboardId;
      const libraryDashboard = this.props.library.dashboards[dashboardId];
      const existingDashboardLoaded =
        isLibraryLoaded && !isEmpty(libraryDashboard.layout);
      if (!existingDashboardLoaded || !libraryDashboard.aggregated) {
        this.setState({ fetchingDashboard: true });
        const filter = (libraryDashboard && libraryDashboard.filter) || {};
        this.props.dispatch(actions.fetchDashboard(dashboardId,
          { filter: (this.props.query && this.props.query.filter) || filter },
          Boolean(this.props.query && this.props.query.filter),
          (dash) => {
            if (dash.filter.datasetId) {
              this.props.dispatch(fetchDataset(dash.filter.datasetId, true,
                datasetCallback(dash)
                ));
            } else {
              this.setState({ fetchingDashboard: false });
            }
          }));
      } else {
        this.loadDashboardIntoState(this.props.library, libraryDashboard);
        if (libraryDashboard.filter.datasetId) {
          this.props.dispatch(fetchDataset(libraryDashboard.filter.datasetId, true,
            datasetCallback(libraryDashboard)
            ));
        } else {
          this.setState({ fetchingDashboard: false });
        }
      }
    }

    this.isMountedFlag = true;
    require.ensure(['../charts/VisualisationViewer'], () => {
      require.ensure([], () => {
        /* eslint-disable global-require */
        const DashboardEditor = require('./DashboardEditor').default;
        const DashboardHeader = require('./DashboardHeader').default;
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

  UNSAFE_componentWillReceiveProps(nextProps) {
    const isEditingExistingDashboard = getEditingStatus(this.props.location);
    const dashboardAlreadyLoaded = this.state.dashboard.layout.length !== 0;
    const { dashboardId } = nextProps.params;
    const sharedAction = get(this.state, 'dashboard.shareId') !== get(nextProps, `library.dashboards[${dashboardId}].shareId`) ||
    get(this.state, 'dashboard.protected') !== get(nextProps, `library.dashboards[${dashboardId}].protected`);
    if ((isEditingExistingDashboard && !dashboardAlreadyLoaded) || sharedAction) {
      /* We need to load a dashboard, and we haven't loaded it yet. Check if nextProps has both i)
      /* the dashboard and ii) the visualisations the dashboard contains, then load the dashboard
      /* editor if both these conditions are true. */

      const dash = nextProps.library.dashboards[dashboardId];
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
        if (dash.aggregated || sharedAction) {
          this.loadDashboardIntoState(nextProps.library, dash);
        }
      }
    }

    if (!this.props.params.dashboardId && dashboardId) {
      this.setState({
        isSavePending: false,
        isUnsavedChanges: false,
        dashboard: Object.assign({}, this.state.dashboard, { id: dashboardId }),
      });
    }
  }

  componentWillUnmount() {
    this.isMountedFlag = false;
  }

  onSaveFailure() {
    this.setState({
      timeToNextSave: this.state.timeToNextSave * 2,
      timeFromPreviousSave: 0,
      savingFailed: true,
    }, () => {
      this.saveInterval = setInterval(() => {
        const { timeFromPreviousSave, timeToNextSave } = this.state;
        if (timeToNextSave - timeFromPreviousSave > SAVE_COUNTDOWN_INTERVAL) {
          this.setState({ timeFromPreviousSave: timeFromPreviousSave + SAVE_COUNTDOWN_INTERVAL });
          return;
        }
        clearInterval(this.saveInterval);
      }, SAVE_COUNTDOWN_INTERVAL);
      setTimeout(() => {
        this.onSave();
      }, this.state.timeToNextSave);
    });
  }

  onApplyFilterValue(filter) {
    const dashboard = getDashboardFromState(this.state.dashboard, false);
    if (filter) {
      this.setState({ fetchingDashboard: true });
      this.props.dispatch(actions.fetchDashboard(dashboard.id,
        { filter: ((this.props.query && this.props.query.filter) || dashboard.filter) },
        Boolean(this.props.query && this.props.query.filter),
        (body) => {
          const dash = body;
          dash.filter = dashboard.filter;
          this.loadDashboardIntoState(this.props.library, dash);
          this.setState({ fetchingDashboard: false, tabSelected: 'filters' });
        }));
    }
  }

  onSave() {
    const { dispatch, location } = this.props;
    const dashboard = getDashboardFromState(this.state.dashboard, false);

    const handleResponse = (error) => {
      if (!this.isMountedFlag) return;
      if (error) {
        this.onSaveFailure();
        return;
      }
      this.setState({
        isUnsavedChanges: false,
        isSavePending: false,
        timeToNextSave: SAVE_INITIAL_TIMEOUT,
        timeFromPreviousSave: 0,
        savingFailed: false,
      });
    };

    if (getEditingStatus(this.props.location)) {
      dispatch(actions.saveDashboardChanges(dashboard, handleResponse));
    } else if (!this.state.isSavePending) {
      this.setState({ isSavePending: true, isUnsavedChanges: false }, () => {
        dispatch(actions.createDashboard(this.props.history, dashboard, get(location, 'state.collectionId'), handleResponse));
      });
    }
  }

  onFilterChange(filter, needToAggregate) {
    const dashboard = this.state.dashboard;
    if (needToAggregate && dashboard.entities
      && Object.values(dashboard.entities).length > 0
      && Object.values(dashboard.entities).find(e => e.filterAffected)) {
      this.onApplyFilterValue(filter);
    } else {
      this.setState({ dashboard });
      this.onSave();
    }
    trackEvent(DASHBOARD_FILTER_CHANGE, window.location.href);
  }

  onFilterValueChange(filter, needToAggregate) {
    this.onApplyFilterValue((needToAggregate || filter.columns.length === 0) && filter);
  }

  onAddVisualisation(visualisation) {
    const { id, datasetId, spec } = visualisation;
    const vType = visualisation.visualisationType;

    if (aggregationOnlyVisualisationTypes.find(item => item === vType)) {
      /* Only fetch the aggregated data */
      let aggType;

      switch (vType) {
        case 'map': {
          const dashboardFilter = this.state.dashboard.filter;
          const filterDatasetId = dashboardFilter.datasetId;
          let adaptedVisualisation = visualisation;
          if (filterDatasetId) {
            adaptedVisualisation = cloneDeep(visualisation);

            const layers = adaptedVisualisation.spec.layers.map((l) => {
              if (l.datasetId === filterDatasetId) {
                const layer = cloneDeep(l);
                const columnFilters = dashboardFilter.columns.filter(c => Boolean(c.value));
                layer.filters = l.filters.concat(columnFilters);
                return layer;
              }
              return l;
            });
            adaptedVisualisation.spec.layers = layers;
          }

          api.post('/api/visualisations/maps', adaptedVisualisation)
            .then((response) => {
              if (response.status >= 200 && response.status < 300) {
                const change = {};
                change[id] = response.body;
                const aggregatedDatasets =
                  Object.assign({}, this.state.aggregatedDatasets, change);

                const metadataChange = this.state.dashboard.metadata || {};
                metadataChange[id] = response.body;
                const dash = this.state.dashboard;
                dash.metadata = metadataChange;

                this.setState({ aggregatedDatasets, dashboard: dash });
              }
            })
            .catch(() => {
              this.props.dispatch(showNotification('error', 'Failed to add visualisation.'));
            });
          /* Maps hit a different endpoint than other aggregations, so bail out now */
          return;
        }
        case 'donut':
        case 'polararea':
          aggType = 'pie';
          break;
        case 'pivot table':
          aggType = 'pivot';
          break;
        case 'area':
          aggType = 'line';
          break;
        default:
          aggType = vType;
          break;
      }

      if (!specIsValidForApi(visualisation.spec, vType)) return;
      const adaptedSpec = cloneDeep(spec);
      if (datasetId === this.state.dashboard.filter.datasetId) {
        const filters = adaptedSpec.filters
        .concat(this.state.dashboard.filter.columns.filter(c => c.value));
        adaptedSpec.filters = filters;
      }
      api.get(`/api/aggregation/${datasetId}/${aggType}`, {
        query: JSON.stringify(adaptedSpec),
      })
      .then(({ body }) => {
        const change = {};
        change[id] = body;
        const aggregatedDatasets = Object.assign({}, this.state.aggregatedDatasets, change);
        this.setState({ aggregatedDatasets });
      })
      .catch(() => {
        this.props.dispatch(showNotification('error', 'Failed to fetch aggregations.'));
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
        this.props.dispatch(fetchDataset(datasetId, true));
      }
    }
  }

  onUpdateName(title) {
    const normalizedTitle = title || this.props.intl.formatMessage({ id: 'untitled_dashboard' });
    const dashboard = Object.assign({}, this.state.dashboard, { title: normalizedTitle });
    this.setState({
      dashboard,
      isUnsavedChanges: true,
    }, () => {
      this.onSave();
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
    }, () => {
      if (this.state.isUnsavedChanges) {
        this.onSave();
      }
    });
  }

  updateEntities(entities) {
    const dashboard = Object.assign({}, this.state.dashboard, { entities });
    this.setState({
      dashboard,
      isUnsavedChanges: true,
    });
  }

  handleTrackPageView(dashboard) {
    if (!this.state.hasTrackedPageView) {
      this.setState({ hasTrackedPageView: true }, () => {
        trackPageView(`Dashboard: ${
          dashboard.title || this.props.intl.formatMessage({ id: 'untitled_dashboard' })
        }`);
      });
    }
  }

  handleDashboardAction(action) {
    const { dashboard } = this.state;
    const url = `${window.location.origin}/dashboard/${dashboard.id}`;
    switch (action) {
      case 'share': {
        trackEvent(SHARE_DASHBOARD, url);
        this.toggleShareDashboard();
        break;
      }
      case 'export_png': {
        trackEvent(EXPORT_DASHBOARD_PNG, url);
        this.props.dispatch(
          actions.exportDashboard(dashboard, { title: dashboard.title })
        );
        break;
      }
      case 'export_pdf': {
        trackEvent(EXPORT_DASHBOARD_PDF, url);
        this.props.dispatch(
          actions.exportDashboard(dashboard, {
            format: 'pdf',
            title: dashboard.title,
          })
        );
        break;
      }
      default:
        throw new Error(`Action ${action} not yet implemented`);
    }
  }

  handleFetchShareId() {
    const dashboard = getDashboardFromState(this.state.dashboard, true);
    this.props.dispatch(actions.fetchShareId(dashboard.id));
  }

  handleSetSharePassword(password) {
    if (!password) {
      this.setState({ passwordAlert: { message: this.props.intl.formatMessage({ id: 'enter_password' }), type: 'danger' } });
      return;
    }
    if (password.length < 8) {
      this.setState({ passwordAlert: { message: this.props.intl.formatMessage({ id: 'enter_password_8' }), type: 'danger' } });
      return;
    }
    const dashboard = getDashboardFromState(this.state.dashboard, true);
    this.setState({ passwordAlert: null });
    this.props.dispatch(actions.setShareProtection(
      dashboard.shareId,
      { password, protected: Boolean(password.length) },
      (error) => {
        const message = get(error, 'message');
        if (message) {
          this.setState({ passwordAlert: { message, type: 'danger' } });
          return;
        }
        this.setState({ passwordAlert: { message: 'Saved successfully.' } });
      }
    ));
  }

  handleToggleShareProtected(isProtected) {
    if (isProtected) {
      this.setState({
        passwordAlert: null,
        dashboard: {
          ...this.state.dashboard,
          protected: isProtected,
        },
      });
    } else {
      const dashboard = getDashboardFromState(this.state.dashboard, true);
      this.setState({ passwordAlert: null });
      this.props.dispatch(actions.setShareProtection(
        dashboard.shareId,
        { protected: false },
        (error) => {
          const message = get(error, 'message');
          if (message) {
            this.setState({ passwordAlert: { message, type: 'danger' } });
            return;
          }
          this.setState({ passwordAlert: { message: 'Saved successfully.' } });
        }
      ));
    }
  }

  toggleShareDashboard() {
    this.setState({
      isShareModalVisible: !this.state.isShareModalVisible,
    });
  }

  loadDashboardIntoState(library, dash) {
    /* Put the dashboard into component state so it is fed to the DashboardEditor */
    const dashboard = Object.assign({}, dash,
      { layout: Object.keys(dash.layout).map(key => dash.layout[key]) }
    );
    this.setState({ dashboard });
    this.handleTrackPageView(dashboard);

    /* Load each unique dataset referenced by visualisations in the dashboard. Note - Even though
    /* onAddVisualisation also checks to see if a datasetId has already been requested, setState is
    /* not synchronous and is too slow here, hence the extra check */
    const requestedDatasetIds = this.state.requestedDatasetIds.slice(0);
    const { ...aggregatedDatasets } = this.state.aggregatedDatasets;

    Object.keys(dash.entities).filter(key => Boolean(dash.entities[key])).forEach((key) => {
      const entity = dash.entities[key];
      const isVisualisation = entity.type === 'visualisation';
      if (isVisualisation) {
        const visualisation = entity;
        if (aggregationOnlyVisualisationTypes.some(type =>
          type === visualisation.visualisationType)) {
          const alreadyProcessed = Boolean(visualisation.data) ||
          Boolean(visualisation.layerMetadata);
          if (!alreadyProcessed) {
            this.onAddVisualisation(library.visualisations[visualisation.id]);
          } else {
            aggregatedDatasets[key] = visualisation.data;
          }
        } else {
          const datasetId = visualisation.datasetId;
          const alreadyProcessed = requestedDatasetIds.some(id => id === datasetId);

          if (!alreadyProcessed) {
            requestedDatasetIds.push(datasetId);
            this.onAddVisualisation(library.visualisations[visualisation.id]);
          } else {
            aggregatedDatasets[key] = visualisation.data;
          }
        }
      }
    });
    this.setState({ aggregatedDatasets });
  }

  addDataToVisualisations(visualisations) {
    const out = {};

    Object.keys(visualisations).filter(key => Boolean(visualisations[key])).forEach((key) => {
      if (this.state.aggregatedDatasets[key]) {
        if (visualisations[key].visualisationType === 'map') {
          const { tenantDB, layerGroupId, metadata } = this.state.aggregatedDatasets[key];
          out[key] = Object.assign(
            {},
            visualisations[key],
            {
              tenantDB,
              layerGroupId,
              metadata,
            },
            {
              spec: Object.assign(
                {},
                visualisations[key].spec,
                {
                  layers: visualisations[key].spec.layers.map((item, idx) => {
                    if (idx === 0 && metadata && metadata.pointColorMapping) {
                      return Object.assign(
                        {},
                        item,
                        { pointColorMapping: metadata.pointColorMapping }
                      );
                    }
                    return item;
                  }),
                }
              ),
            }
          );
        } else {
          out[key] = Object.assign(
            {},
            visualisations[key],
            { data: this.state.aggregatedDatasets[key] }
          );
        }
      } else {
        out[key] = visualisations[key];
      }
    });
    return out;
  }

  render() {
    if (!this.state.asyncComponents || this.state.isSavePending || this.state.fetchingDashboard) {
      return <LoadingSpinner />;
    }
    const { DashboardHeader, DashboardEditor } = this.state.asyncComponents;
    const dashboard = getDashboardFromState(this.state.dashboard, true);
    const { exporting, history } = this.props;
    const filteredDashboard = (this.props.filteredDashboard && !filteredDashboardCondition()) ||
    Boolean(this.props.query && this.props.query.filter);
    return (
      <NavigationPrompt shouldPrompt={this.state.savingFailed} history={history}>
        <BodyClassName className={exporting ? 'exporting' : ''}>
          <div className="Dashboard">
            {!exporting && (
              <DashboardHeader
                history={history}
                title={dashboard.title}
                isUnsavedChanges={this.state.isUnsavedChanges}
                onDashboardAction={this.handleDashboardAction}
                onChangeTitle={this.onUpdateName}
                onBeginEditTitle={() => this.setState({ isUnsavedChanges: true })}
                onSaveDashboard={this.onSave}
                savingFailed={this.state.savingFailed}
                timeToNextSave={this.state.timeToNextSave - this.state.timeFromPreviousSave}
                isExporting={get(this.props, `library.dashboards[${dashboard.id}].isExporting`)}
              />
            )}
            {exporting && (
              <h1 className="export-header">{dashboard.title}</h1>
            )}
            <DashboardEditor
              dashboard={dashboard}
              onFilterChange={this.onFilterChange}
              onFilterValueChange={this.onFilterValueChange}
              filteredDashboard={filteredDashboard}
              datasets={this.props.library.datasets}
              visualisations={this.addDataToVisualisations(this.props.library.visualisations)}
              metadata={this.state.dashboard.metadata}
              onAddVisualisation={this.onAddVisualisation}
              onSave={this.onSave}
              onUpdateLayout={this.updateLayout}
              onUpdateEntities={this.updateEntities}
              onUpdateName={this.onUpdateName}
              print={this.props.print}
              query={this.props.query}
              exporting={exporting}
              tabSelected={this.state.tabSelected}
              onTabSelected={tab => this.setState({ tabSelected: tab })}
              preventPageOverlaps={this.props.preventPageOverlaps}
              intl={this.props.intl}
            />
            {!exporting && (
              <ShareEntity
                isOpen={this.state.isShareModalVisible}
                onClose={this.toggleShareDashboard}
                title={dashboard.title}
                shareId={get(this.state, 'dashboard.shareId')}
                protected={get(this.state, 'dashboard.protected')}
                type={dashboard.type}
                canSetPrivacy
                onSetPassword={this.handleSetSharePassword}
                onFetchShareId={this.handleFetchShareId}
                onToggleProtected={this.handleToggleShareProtected}
                alert={this.state.passwordAlert}
              />
            )}
          </div>
        </BodyClassName>
      </NavigationPrompt>
    );
  }
}

Dashboard.propTypes = {
  intl: intlShape,
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  library: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
  exporting: PropTypes.bool,
  filteredDashboard: PropTypes.bool,
  preventPageOverlaps: PropTypes.bool,
  print: printShape,
  query: PropTypes.object,
};

export default connect(state => state)(injectIntl(Dashboard));
