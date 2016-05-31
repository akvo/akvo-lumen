import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import DashboardEditor from '../components/dashboard/DashboardEditor';
import EntityTypeHeader from '../components/entity-editor/EntityTypeHeader';
import * as actions from '../actions/dashboard';
import { fetchDataset } from '../actions/dataset';
import { push } from 'react-router-redux';

const getEditingStatus = location => {
  const testString = 'create';

  return location.pathname.indexOf(testString) === -1;
};

const getLayoutObjectFromArray = arr => {
  const object = {};

  arr.forEach(item => {
    const key = item.i;

    object[key] = item;
  });

  return object;
};

const getDashboardFromState = state => (
  {
    type: state.type,
    name: state.name,
    entities: state.entities,
    layout: getLayoutObjectFromArray(state.layout),
  }
);

class Dashboard extends Component {

  constructor() {
    super();
    this.state = {
      type: 'dashboard',
      name: 'Untitled dashboard',
      entities: {},
      layout: [],
    };
    this.onAddVisualisation = this.onAddVisualisation.bind(this);
    this.updateLayout = this.updateLayout.bind(this);
    this.updateEntities = this.updateEntities.bind(this);
    this.onUpdateName = this.onUpdateName.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  componentWillMount() {
    const isEditingExistingDashboard = getEditingStatus(this.props.location);

    if (isEditingExistingDashboard) {
      const dashboardId = this.props.params.dashboardId;
      this.props.dispatch(actions.fetchDashboard(dashboardId));
      this.setState(this.props.library.visualisations[dashboardId]);
      this.setState({ isUnsavedChanges: false });
    }
  }

  componentWillReceiveProps() {
    /*
    this.setState(this.props.library.dashboards[this.props.params.dashboardId]);
    */
  }

  onSave() {
    const { dispatch } = this.props;
    const dashboard = getDashboardFromState(this.state);
    console.log(dashboard);
    this.setState({
      isUnsavedChanges: false,
    });
    if (this.state.id) {
      dispatch(actions.saveDashboardChanges(this.state));
    } else {
      dispatch(actions.createDashboard(this.state));
    }
    dispatch(push('/library?filter=dashboards&sort=created'));
  }

  onAddVisualisation(datasetId) {
    if (!this.props.library.datasets[datasetId].columns) {
      this.props.dispatch(fetchDataset(datasetId));
    }
  }

  onUpdateName(name) {
    this.setState({ name });
  }

  updateLayout(layout) {
    this.setState({ layout });
  }

  updateEntities(entities) {
    this.setState({ entities });
  }

  render() {
    return (
      <div className="Dashboard">
        <EntityTypeHeader
          title={this.state.name}
          saveStatus={'Saving not yet implemented'}
          actionButtons={[]}
        />
        <DashboardEditor
          dashboard={this.state}
          datasets={this.props.library.datasets}
          visualisations={this.props.library.visualisations}
          onAddVisualisation={this.onAddVisualisation}
          onSave={this.onSave}
          onUpdateLayout={this.updateLayout}
          onUpdateEntities={this.updateEntities}
          onUpdateName={this.onUpdateName}
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
