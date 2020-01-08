import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';

require('../dashboard/DashboardEditor.scss');
require('./Dashboard2EditorCanvas.scss');

class Dashboard2EditorCanvas extends Component {

  constructor(props) {
    super(props);
    this.state = {
      gridWidth: 1024,
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
    // Offset the padding width (16px on each side)
    const newWidth = this.DashboardEditorCanvasContainer.clientWidth - 32;
    if (newWidth !== this.state.gridWidth) {
      this.setState({
        gridWidth: newWidth,
      });
    }
  }

  render() {
    const canvasWidth = this.state.gridWidth;
    const canvasStyle = {
      width: `${canvasWidth}px`,
    };

    return (
      <div
        className="DashboardEditorCanvasContainer"
        id="DashboardEditorCanvasContainer"
        ref={(ref) => { this.DashboardEditorCanvasContainer = ref; }}
      >
        <div className="DashboardEditorCanvas Dashboard2EditorCanvas">
          <div style={canvasStyle}>
            <h4>Canvas</h4>
          </div>
        </div>
      </div>
    );
  }
}

Dashboard2EditorCanvas.propTypes = {
  intl: intlShape,
  dashboard: PropTypes.object.isRequired,
};

export default Dashboard2EditorCanvas;
