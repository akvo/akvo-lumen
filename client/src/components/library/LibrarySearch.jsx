import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

export default class LibrarySearch extends Component {

  constructor(props) {
    super(props);
    this.state = {
      searchText: props.searchString || '',
    };
  }

  render() {
    return (
      <div className="LibrarySearch">
        <input
          className="search"
          onChange={evt => this.setState({ searchText: evt.target.value })}
          value={this.state.searchText}
          onKeyDown={evt => (evt.key === 'Enter' && this.props.onSearch(this.state.searchText.trim()))}
          placeholder="Search"
        />
        <button
          style={{
            opacity: this.state.searchText ? 1 : 0,
          }}
          className={`clickable clear ${this.state.searchText ? '' : 'noPointerEvents'}`}
          onClick={() => {
            this.setState({ searchText: '' });
            this.props.onSearch('');
          }}
        >
          ✕
        </button>
        <button
          onClick={() => this.props.onSearch(this.state.searchText.trim())}
          className="clickable submit"
        >
          <FormattedMessage id="search" />
        </button>
      </div>
    );
  }
}

LibrarySearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
  searchString: PropTypes.string,
};
