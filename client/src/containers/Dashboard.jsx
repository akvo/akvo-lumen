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

class Dashboard extends Component {

  constructor() {
    super();
    this.state = {
      type: 'dashboard',
      name: 'Untitled Dashboard',
      isUnsavedChanges: false,
      spec: {
        entities: [],
      },
    };
    this.onAddVisualisation = this.onAddVisualisation.bind(this);
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
    this.setState(this.props.library.dashboards[this.props.params.dashboardId]);
  }

  onSave() {
    const { dispatch } = this.props;
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

  render() {
    return (
      <div className="Dashboard">
        <EntityTypeHeader
          title={'Untitled dashboard'}
          saveStatus={'Saving not yet implemented'}
          actionButtons={[]}
        />
        <DashboardEditor
          dashboard={this.state}
          datasets={this.props.library.datasets}
          visualisations={this.props.library.visualisations}
          onAddVisualisation={this.onAddVisualisation}
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
