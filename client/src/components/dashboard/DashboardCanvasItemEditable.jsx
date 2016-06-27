import React, { Component, PropTypes } from 'react';

export default class DashboardCanvasItemEditable extends Component {
  constructor() {
    super();
    this.state = {
      textContents: 'Enter text here',
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
  }
  componentWillMount() {
    this.setState({ textContents: this.props.item.content || 'Enter text here' });
  }
  handleChange(evt) {
    this.setState({ textContents: evt.target.value });
  }
  handleBlur() {
    const newItem = this.props.item;

    newItem.content = this.state.textContents;
    this.props.onEntityUpdate(newItem);
  }
  handleFocus() {
    if (this.state.textContents === 'Enter text here') {
      this.setState({ textContents: '' });
    }
  }
  render() {
    return (
      <div
        className="DashboardCanvasItemEditable"
      >
        <textarea
          type="text"
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          value={this.state.textContents}
          style={{
            width: '95%',
            height: '100%',
            resize: 'none',
            border: 'none',
            marginRight: '5%',
          }}
        />
      </div>
    );
  }
}

DashboardCanvasItemEditable.propTypes = {
  item: PropTypes.object.isRequired,
  onEntityUpdate: PropTypes.func.isRequired,
};
