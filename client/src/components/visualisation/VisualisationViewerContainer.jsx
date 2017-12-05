import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AsyncVisualisationViewer from '../charts/AsyncVisualisationViewer';

const viewportLimits = [
  {
    limit: 720,
    name: 'small',
  },
  {
    limit: 1024,
    name: 'medium',
  },
  {
    limit: Infinity,
    name: 'large',
  },
];

export default class VisualisationViewerContainer extends Component {
  constructor() {
    super();
    this.state = {
      clientHeight: 500,
      clientWidth: 1080,
      viewportType: 'large',
    };

    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener(
      'resize', () => this.handleResize
    );
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    const height = this.VisualisationViewerContainer.clientHeight;
    const width = this.VisualisationViewerContainer.clientWidth;
    let viewport;

    for (let i = 0; i < viewportLimits.length; i += 1) {
      const entry = viewportLimits[i];

      if (width < entry.limit) {
        viewport = entry.name;
        break;
      }
    }

    this.setState({
      clientHeight: height,
      clientWidth: width,
      viewportType: viewport,
    });
  }

  render() {
    const { datasets, visualisation } = this.props;
    return (
      <div
        style={{ width: '100%', height: '100%' }}
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
