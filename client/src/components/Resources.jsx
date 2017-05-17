import React, { Component, PropTypes } from 'react';
import * as api from '../api';

function resourceRuleDescription(resourceKey) {
  let description = null;
  switch (resourceKey) {
    case 'numberOfVisualisations':
      description = 'Number of visualisations';
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
          <th>Rule</th>
          <th>Limit</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(resources).map(key =>
          <tr key={key}>
            <td>{resourceRuleDescription(key)}</td>
            <td>{resources[key]}</td>
          </tr>
        )}
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
      plan: {
        created: 1495020745539,
        tier: 'none',
      },
      resources: {
        numberOfVisualisations: 99,
      },
    };
    this.getResources = this.getResources.bind(this);
  }

  componentWillMount() {
    this.getResources();
  }

  getResources() {
    api.get('/api/resources')
      .then(response => response.json())
      .then(resources => this.setState(resources));
  }

  render() {
    const currentTier = this.state.plan.tier;
    const resources = this.state.resources;
    return (
      <div>
        Plan: {currentTier}
        <ResourceList resources={resources} />
      </div>
    );
  }
}

Resources.propTypes = {
  location: PropTypes.object,
  dispatch: PropTypes.func,
};

export default Resources;
