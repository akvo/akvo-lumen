import React, { Component, PropTypes } from 'react';

export default class LibrarySearch extends Component {

  constructor() {
    super();
    this.state = {
      searchText: '',
    };
  }

  componentWillMount() {
    if (this.props.searchString) {
      this.setState({ searchText: this.props.searchString });
    }
  }

  render() {
    return (
      <div className="LibrarySearch">
        <input
          className="search"
          onChange={evt => this.setState({ searchText: evt.target.value })}
          value={this.state.searchText}
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
          Search
        </button>
      </div>
    );
  }
}

LibrarySearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
  searchString: PropTypes.string,
};
