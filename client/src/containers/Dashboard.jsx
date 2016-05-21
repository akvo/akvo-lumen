import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import update from 'react-addons-update';
import DashboardEditor from '../components/dashboard/DashboardEditor';
import EntityTypeHeader from '../components/entity-editor/EntityTypeHeader';
import * as actions from '../actions/dashboard';
import { fetchDataset } from '../actions/dataset';
import { push } from 'react-router-redux';

// require('../styles/Dashboard.scss');

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

/*
          onChangeTitle={event => (
            this.setState({
              name: event.target.value,
              isUnsavedChanges: true,
            })
          )}
          onChangeDashboardType={value => {
            this.setState({
              visualisationType: value,
              isUnsavedChanges: true,
            });
          }}
          onChangeSourceDataset={value => (
            this.handleChangeSourceDataset(value)
          )}
          onChangeDashboardSpec={value => {
            const spec = update(this.state.spec, { $merge: value });
            this.setState({
              isUnsavedChanges: true,
              spec,
            });
          }}
          onSaveDashboard={() => (
            this.onSave()
          )}
*/
