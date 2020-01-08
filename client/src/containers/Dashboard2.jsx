import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { intlShape, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import { saveAs } from 'file-saver/FileSaver';
import { fetchLibrary } from '../actions/library';
import { isEmpty } from 'lodash';
import { base64ToBlob, extToContentType } from '../utilities/export';
import * as api from '../utilities/api';
import { showNotification } from '../actions/notification';
import Dashboard2Editor from '../components/dashboard2/Dashboard2Editor';
import Dashboard2Header from '../components/dashboard2/Dashboard2Header';

// https://github.com/mo/abortcontroller-polyfill/issues/10
const AbortController = window.AbortController;

class Dashboard2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dashboard: {
        type: 'dashboard',
        title: props.intl.formatMessage({ id: 'untitled_dashboard' }),
        entities: {},
        layout: [],
      },
    };
    this.pendingRequests = [];
    this.updateEntities = this.updateEntities.bind(this);
  }

  componentDidMount() {
    const { dashboardId } = this.props.routeParams;
    const isLibraryLoaded = !isEmpty(this.props.library.visualisations);

    if (!isLibraryLoaded) {
      this.props.dispatch(fetchLibrary());
    }
    if (dashboardId != null) {
      const controller = new AbortController();
      const signal = controller.signal;
      this.pendingRequests.push(controller);

      api
        .get(`/api/dashboards/${dashboardId}`, {}, {}, signal)
        .then(({ body }) => {
          const dashboard = body;
          this.setState({
            dashboard,
          });
        })
        .catch(() => {
          this.props.dispatch(showNotification('error', 'Failed to get dashboard'));
        })
        .finally(() => {
          this.pendingRequests = this.pendingRequests.filter(c => c !== controller);
        });
    }
  }

  componentWillUnmount() {
    this.pendingRequests.map(controller => controller.abort());
  }

  onChangeTitle = (newTitle) => {
    let title;
    if (this.isDashboardDraft()) {
      title = !newTitle ? this.props.intl.formatMessage({ id: 'untitled_dashboard' }) : newTitle;
    } else {
      title = !newTitle ? this.state.dashboard.title : newTitle;
    }

    const dashboard = Object.assign({}, this.state.dashboard, { title });
    if (this.isDashboardDraft() && this.isValidTitle(title)) {
      this.setState(
        {
          dashboard,
        },
        () => {
          this.createDashboard();
        }
      );
    } else {
      this.setState(
        {
          dashboard,
          isUnsavedChanges: true,
        },
        () => {
          this.saveDashboard();
        }
      );
    }
  };

  isValidTitle = title =>
    title.length > 3 && title !== this.props.intl.formatMessage({ id: 'untitled_dashboard' });

  isDashboardDraft = () => this.state.dashboard.id == null;

  createDashboard = () => {
    const dashboardDraft = this.state.dashboard;

    const controller = new AbortController();
    const signal = controller.signal;
    this.pendingRequests.push(controller);

    api
      .post('/api/dashboards', dashboardDraft, {}, signal)
      .then(({ body }) => {
        const dashboard = body;
        this.setState({
          dashboard,
        });
        this.props.router.push(`/dashboard/${dashboard.id}`);
      })
      .catch(() => {
        this.props.dispatch(showNotification('error', 'Failed to create dashboard'));
      })
      .finally(() => {
        this.pendingRequests = this.pendingRequests.filter(c => c !== controller);
      });
  };

  saveDashboard = () => {
    if (this.state.isUnsavedChanges) {
      const newDashboard = this.state.dashboard;

      const controller = new AbortController();
      const signal = controller.signal;
      this.pendingRequests.push(controller);

      api
        .put(`/api/dashboards/${newDashboard.id}`, newDashboard, {}, signal)
        .then(({ body }) => {
          const dashboard = body;
          this.setState({
            dashboard,
            isUnsavedChanges: false,
          });
        })
        .catch(() => {
          this.props.dispatch(showNotification('error', 'Failed to save dashboard'));
        })
        .finally(() => {
          this.pendingRequests = this.pendingRequests.filter(c => c !== controller);
        });
    }
  };

  exportDashboard = (dashboard, options) => {
    if (dashboard.id == null) throw new Error('dashboard.id not set');

    const { format, title } = { format: 'png', title: 'Untitled Dashboard', ...options };
    const target = `${window.location.origin}/dashboard2/${dashboard.id}/export${
      format === 'pdf' ? '_pages' : ''
    }`;

    const controller = new AbortController();
    const signal = controller.signal;
    this.pendingRequests.push(controller);

    api
      .post(
        '/api/exports',
      {
        format,
        title,
        selector: Object.keys(dashboard.entities)
            .filter(key => dashboard.entities[key].type === 'visualisation')
            .map(key => `.render-completed-${key}`)
            .join(','),
        target,
      },
        {},
        signal
      )
      .then((response) => {
        response.text().then((imageStr) => {
          const blob = base64ToBlob(imageStr, extToContentType(format));
          saveAs(blob, `${title}.${format}`);
        });
      })
      .catch(() => {
        this.props.dispatch(showNotification('error', 'Failed to export dashboard'));
      })
      .finally(() => {
        this.pendingRequests = this.pendingRequests.filter(c => c !== controller);
      });
  };

  handleDashboardAction = (action) => {
    // Add trackEvents

    const { dashboard } = this.state;

    switch (action) {
      case 'share': {
        console.log('@share');
        break;
      }
      case 'export_png': {
        this.exportDashboard(dashboard, { title: dashboard.title });
        break;
      }
      case 'export_pdf': {
        this.exportDashboard(dashboard, {
          format: 'pdf',
          title: dashboard.title,
        });
        break;
      }
      default:
        throw new Error(`Action ${action} not yet implemented`);
    }
  };
  updateEntities(entities) {
    const dashboard = Object.assign({}, this.state.dashboard, { entities });
    this.setState({
      dashboard,
      isUnsavedChanges: true,
    }, () => {
      this.saveDashboard();
    });
  }

  render() {
    const { dashboard, intl } = this.state;
    const { title } = dashboard;
    return (
      <div className="Dashboard2">
        <Dashboard2Header
          isDashboardDraft={this.isDashboardDraft()}
          onDashboardAction={this.handleDashboardAction}
          onChangeTitle={this.onChangeTitle}
          onSave={this.onSave}
          title={title}
        />
        {!this.isDashboardDraft() && (
          <div className="Dashboard2Content">
            <Dashboard2Editor dashboard={dashboard} library={this.props.library} intl={intl} onUpdateEntities={this.updateEntities}/>
          </div>
        )}
      </div>
    );
  }
}

Dashboard2.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: intlShape,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
  router: PropTypes.object.isRequired,
  routeParams: PropTypes.object.isRequired,
  library: PropTypes.object,
};

export default connect((state, props) => ({
  library: state.library,
}))(withRouter(injectIntl(Dashboard2)));
