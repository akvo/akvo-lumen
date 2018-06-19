import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape, injectIntl } from 'react-intl';

class EntityTitleInput extends Component {

  constructor() {
    super();
    this.state = {
      editMode: false,
      workingTitle: '',
    };
  }

  render() {
    const { title, onChangeTitle, intl } = this.props;
    const titleIsDefault = [
      intl.formatMessage({ id: 'untitled_dashboard' }),
      intl.formatMessage({ id: 'untitled_visualisation' }),
      intl.formatMessage({ id: 'untitled_collection' }),
    ].includes(title);
    const h3Class = `entityTitle
      ${onChangeTitle ? 'clickable' : ''}
      ${titleIsDefault ? 'default' : 'custom'}`;

    return (
      <div
        className="EntityTitleInput"
        data-test-id="entity-title"
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
              data-test-id="entity-title"
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
  intl: intlShape,
  title: PropTypes.string.isRequired,
  onChangeTitle: PropTypes.func,
  onBeginEditTitle: PropTypes.func,
};

export default injectIntl(EntityTitleInput);
