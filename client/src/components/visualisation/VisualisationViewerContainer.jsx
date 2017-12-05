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
    const height = this.VisualisationViewerContainer.clientHeight;
    const width = this.VisualisationViewerContainer.clientWidth;

    this.setState({
      clientHeight: height,
      clientWidth: width,
    });
  }

  render() {
    const { datasets, visualisation } = this.props;
    return (
      <div
        className="VisualisationViewerContainer"
        ref={(ref) => { this.VisualisationViewerContainer = ref; }}
      >
        <AsyncVisualisationViewer
          datasets={datasets}
          visualisation={visualisation}
          height={this.state.clientHeight}
          width={this.state.clientWidth}
        />
      </div>
    );
  }
}

VisualisationViewerContainer.propTypes = {
  datasets: PropTypes.object.isRequired,
  visualisation: PropTypes.object.isRequired,
};
