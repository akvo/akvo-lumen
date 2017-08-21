import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as api from '../api';

require('./Resources.scss');

function resourceRuleDescription(resourceKey) {
  let description = null;
  switch (resourceKey) {
    case 'numberOfVisualisations':
      description = 'Number of visualisations';
      break;
    case 'numberOfExternalDatasets':
      description = 'Number of external datasets';
      break;
    default:
      description = resourceKey;
  }
  return description;
}

function resourceDescription(limit) {
  let l = null;
  if (limit == null) {
    l = 'unlimited';
  } else {
    l = limit;
  }
  return l;
}

function ResourceList({ resources, tier }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Policy</th>
          <th>Limit</th>
          <th>Current</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(resources).map(key =>
          <tr key={key}>
            <td>{resourceRuleDescription(key)}</td>
            <td>{resourceDescription(tier[key])}</td>
            <td>{resources && resources[key]}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
ResourceList.propTypes = {
  resources: PropTypes.object,
  tier: PropTypes.object,
};

class Resources extends Component {
  constructor(props) {
    super(props);
    this.state = {
      plan: {},
      resources: {},
      tiers: {},
    };
    this.getResources = this.getResources.bind(this);
    this.getTiers = this.getTiers.bind(this);
  }

  componentWillMount() {
    this.getResources();
    this.getTiers();
  }

  getResources() {
    api.get('/api/resources')
      .then(response => response.json())
      .then(resources => this.setState(resources));
  }

  getTiers() {
    api.get('/api/tiers')
      .then(response => response.json())
      .then(tiers => this.setState(tiers));
  }

  render() {
    const currentPlan = this.state.plan.tier;
    const tiers = this.state.tiers;
    const resources = this.state.resources;

    return (
      <div className="resourceContainer">
        Plan: {currentPlan}
        <ResourceList resources={resources} tier={tiers[currentPlan]} />
      </div>
    );
  }
}

Resources.propTypes = {
  location: PropTypes.object,
  dispatch: PropTypes.func,
};

export default Resources;
