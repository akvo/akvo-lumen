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
    case 'dataUpdate':
      description = 'Data update mode';
      break;
    default:
      description = resourceKey;
  }
  return description;
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
            <td>{tier && tier[key]}</td>
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
      tier: {},
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
    const currentTierLabel = this.state.plan.tier;
    const tiers = this.state.tiers;
    const resources = this.state.resources;
    let currentTier = null;

    if (tiers !== undefined && currentTierLabel !== undefined) {
      currentTier = tiers.filter(tier =>
        currentTierLabel === tier.tier
      )[0];
    }

    return (
      <div className="resourceContainer">
        Plan: {currentTierLabel}
        <ResourceList resources={resources} tier={currentTier} />
      </div>
    );
  }
}

Resources.propTypes = {
  location: PropTypes.object,
  dispatch: PropTypes.func,
};

export default Resources;
