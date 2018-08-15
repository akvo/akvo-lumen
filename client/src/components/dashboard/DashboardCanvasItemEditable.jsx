import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape, injectIntl } from 'react-intl';

class DashboardCanvasItemEditable extends Component {
  constructor(props) {
    super(props);
    this.placeholder = props.intl.formatMessage({ id: 'enter_text_here' });
    this.state = {};
    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }
  componentWillMount() {
    this.setState({
      textContents: this.placeholder !== this.props.item.content ?
        this.props.item.content :
        this.placeholder,
    });
  }
  handleChange(evt) {
    this.setState({ textContents: evt.target.value });
  }
  handleBlur() {
    const newItem = { ...this.props.item, content: this.state.textContents };
    this.props.onEntityUpdate(newItem);
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
          placeholder={this.placeholder}
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
  intl: intlShape,
  item: PropTypes.object.isRequired,
  onEntityUpdate: PropTypes.func.isRequired,
};

export default injectIntl(DashboardCanvasItemEditable);
