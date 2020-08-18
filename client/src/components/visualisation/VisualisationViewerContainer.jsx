import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AsyncVisualisationViewer from '../charts/AsyncVisualisationViewer';

require('./VisualisationViewerContainer.scss');

export default class VisualisationViewerContainer extends Component {
  constructor() {
    super();
    this.state = {
      clientHeight: 500,
      clientWidth: 1080,
    };

    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    const height = Math.max(window.innerHeight, this.sizeNode.clientHeight);
    const width = Math.max(window.innerWidth, this.sizeNode.clientWidth);

    this.setState({
      clientHeight: height,
      clientWidth: width,
    });
  }

  render() {
    const { datasets, visualisation, metadata, env } = this.props;
    return (
      <div className="VisualisationViewerContainer">
        <div
          className="sizeNode"
          ref={(ref) => { this.sizeNode = ref; }}
        >
          <AsyncVisualisationViewer
            metadata={metadata}
            datasets={datasets}
            visualisation={visualisation}
            height={this.state.clientHeight}
            width={this.state.clientWidth}
            env={env}
          />
        </div>
      </div>
    );
  }
}

VisualisationViewerContainer.propTypes = {
  datasets: PropTypes.object.isRequired,
  visualisation: PropTypes.object.isRequired,
  metadata: PropTypes.object,
  env: PropTypes.any,
};
