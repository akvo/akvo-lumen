/* eslint-disable react/no-danger */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape, injectIntl } from 'react-intl';
import ReactQuill from 'react-quill';

import './DashboardCanvasItemEditable.scss';

class DashboardCanvasItemEditable extends Component {
  constructor(props) {
    super(props);
    this.placeholder = props.intl.formatMessage({ id: 'enter_text_here' });
    this.state = {
      textContents: this.placeholder !== props.item.content ?
        props.item.content :
        this.placeholder,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.inputElement = React.createRef();
  }

  componentDidMount() {
    if (this.props.focused) {
      this.focusInput();
    }
  }
  handleChange(textContents) {
    this.setState({ textContents });
  }
  handleBlur() {
    const newItem = { ...this.props.item, content: this.state.textContents };
    this.props.onEntityUpdate(newItem);
    this.props.onSave();
  }
  handleFocus() {
    this.props.onFocus();
    this.focusInput();
  }
  focusInput() {
    if (!this.inputElement.current) return;
    this.inputElement.current.focus();
    this.inputElement.current.getEditor().setSelection(10000, 10000);
  }
  render() {
    return (
      <div className="DashboardCanvasItemEditable">
        {this.props.focused && (
          <ReactQuill
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            value={this.state.textContents}
            placeholder={this.placeholder}
            style={{ flex: 1 }}
            ref={this.inputElement}
            className="DashboardCanvasItemEditableInput"
          />
        )}
        {!this.props.focused && (
          <div
            className="itemContainer text"
            dangerouslySetInnerHTML={{ __html: this.state.textContents || this.placeholder }}
          />
        )}
        {!this.props.focused && (
          <div
            onClick={this.handleFocus}
            className="DashboardCanvasItemEditableOverlay"
          />
        )}
      </div>
    );
  }
}

DashboardCanvasItemEditable.propTypes = {
  intl: intlShape,
  item: PropTypes.object.isRequired,
  onEntityUpdate: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  focused: PropTypes.bool,
  onSave: PropTypes.func,
};

export default injectIntl(DashboardCanvasItemEditable);
