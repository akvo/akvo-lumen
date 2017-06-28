import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class EntityTitleInput extends Component {

  constructor() {
    super();
    this.state = {
      editMode: false,
      workingTitle: '',
    };
  }

  render() {
    const { title, onChangeTitle } = this.props;
    const titleIsDefault = title.toLowerCase().indexOf('untitled') > -1;
    const h3Class = `entityTitle
      ${onChangeTitle ? 'clickable' : ''}
      ${titleIsDefault ? 'default' : 'custom'}`;

    return (
      <div
        className="EntityTitleInput"
      >
        {onChangeTitle ?
          <h1
            className={h3Class}
            onClick={() => {
              if (!this.state.editMode) {
                const workingTitle = titleIsDefault ? '' : title;
                this.setState({ editMode: true, workingTitle });
                this.titleInput.style.display = 'initial';
                this.titleInput.focus();
              }
              if (this.props.onBeginEditTitle) {
                this.props.onBeginEditTitle();
              }
            }}
          >
            <input
              className="entityTitleInput"
              style={{ display: 'none' }}
              type="text"
              ref={(titleInput) => { this.titleInput = titleInput; }}
              value={this.state.workingTitle}
              onChange={evt => this.setState({ workingTitle: evt.target.value })}
              onBlur={() => {
                this.setState({ editMode: false });
                onChangeTitle(this.state.workingTitle);
                this.titleInput.style.display = 'none';
              }}
            />
            <span
              style={{
                display: this.state.editMode ? 'none' : 'block',
              }}
            >
              {title}
            </span>
          </h1>
          :
          <h1
            className={h3Class}
          >
            {title}
          </h1>
        }
      </div>
    );
  }
}

EntityTitleInput.propTypes = {
  title: PropTypes.string.isRequired,
  onChangeTitle: PropTypes.func,
  onBeginEditTitle: PropTypes.func,
};
