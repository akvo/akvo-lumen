import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import * as api from '../utilities/api';
import { showNotification } from '../actions/notification';

require('./Resources.scss');

function resourceRuleDescription(resourceKey) {
  let description = null;
  switch (resourceKey) {
    case 'numberOfVisualisations':
      description = 'Visualisations';
      break;
    case 'numberOfExternalDatasets':
      description = 'External datasets';
      break;
    case 'numberOfDashboards':
      description = 'Dashboards';
      break;
    default:
      description = resourceKey;
  }
  return description;
}

function ResourceList({ resources }) {
  return (
    <table>
      <thead>
        <tr>
          <th />
        </tr>
      </thead>
      <tbody>
        {Object.keys(resources).map(key => (
          <tr key={key}>
            <td>{resourceRuleDescription(key)}</td>
            <td>{resources && resources[key]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
ResourceList.propTypes = {
  resources: PropTypes.object,
};

class Resources extends Component {
  constructor(props) {
    super(props);
    this.state = {
      resources: {},
    };
    this.getResources = this.getResources.bind(this);
  }

  componentDidMount() {
    this.getResources();
  }

  getResources() {
    api.get('/api/resources')
      .then(({ body: { resources } }) => this.setState({ resources }))
      .catch(() => {
        this.props.dispatch(showNotification('error', 'Failed to fetch resources.'));
      });
  }

  render() {
    const resources = this.state.resources;

    return (
      <div className="resourceContainer">
        <ResourceList resources={resources} />
      </div>
    );
  }
}

Resources.propTypes = {
  location: PropTypes.object,
  dispatch: PropTypes.func,
};

export default connect(state => state)(Resources);
