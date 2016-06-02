import React, { Component, PropTypes } from 'react';
import ContentEditable from 'react-contenteditable';

export default class DashboardCanvasItemEditable extends Component {
  constructor() {
    super();
    this.state = {
      html: 'Enter text here',
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }
  componentWillMount() {
    this.setState({ html: this.props.item.content || 'Enter text here' });
  }
  handleChange(evt) {
    this.setState({ html: evt.target.value });
  }
  handleBlur() {
    const newItem = this.props.item;

    newItem.content = this.state.html;
    this.props.onEntityUpdate(newItem);
  }
  render() {
    return (
      <div
        className="DashboardCanvasItemEditable"
        onBlur={this.handleBlur}
      >
        <ContentEditable
          html={this.state.html}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}

DashboardCanvasItemEditable.propTypes = {
  item: PropTypes.object.isRequired,
  onEntityUpdate: PropTypes.func.isRequired,
};
