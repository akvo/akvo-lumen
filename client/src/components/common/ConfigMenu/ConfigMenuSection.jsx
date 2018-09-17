import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { isString } from 'lodash';

import './ConfigMenuSection.scss';

class ConfigMenuSection extends Component {
  state = {
    advancedOptionsVisible: false,
  }

  render() {
    const { title, options, advancedOptions, children, ...rest } = this.props;
    return (
      <div {...rest} className={`ConfigMenuSection ${rest.className ? rest.className : ''}`}>
        {isString(title) ? (
          <h3>
            <FormattedMessage id={title} />
          </h3>
        ) : title}
        <div
          className={`ConfigMenuSection-inner ${
            !title ? 'ConfigMenuSection-inner--without-title' : ''}`
          }
        >
          {options}
          {(advancedOptions || children) && (
            <a
              onClick={() => {
                this.setState({ advancedOptionsVisible: !this.state.advancedOptionsVisible });
              }}
              className="ConfigMenuSection-advanced-seperator"
            >
              <span>
                <FormattedMessage id="advanced" />
                <i className={`fa fa-caret-${this.state.advancedOptionsVisible ? 'up' : 'down'}`} />
              </span>
            </a>
          )}
          {advancedOptions && this.state.advancedOptionsVisible && advancedOptions}
          {children && this.state.advancedOptionsVisible && children}
        </div>
        <div className="clearfix" />
      </div>
    );
  }
}

ConfigMenuSection.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]),
  options: PropTypes.node.isRequired,
  advancedOptions: PropTypes.node,
  children: PropTypes.node,
};

export default ConfigMenuSection;
