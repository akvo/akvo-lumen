import React, { Component, PropTypes } from 'react';
import * as api from '../api';

class Resources extends Component {
  constructor(props) {
    super(props);
    this.state = {
      plan: 'none',
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
      // .then(resources => console.log(resources));
      //.then(resources => this.setState({ resources }));
  }

  render() {
    const plan = this.state.plan;
    const resources = this.state.resources;
    const visualisations = resources.numberOfVisualisations;
    // const numberOfVisualisations = this.state.resources.numberOfVisualisations;
    return (
      <div>
        Plan: {plan}<br />
      Visualisations: {visualisations}
      </div>
    );
  }

}

Resources.propTypes = {
  location: PropTypes.object,
  dispatch: PropTypes.func,
};

export default Resources;
