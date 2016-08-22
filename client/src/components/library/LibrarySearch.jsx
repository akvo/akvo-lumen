import React, { Component, PropTypes } from 'react';

export default class LibrarySearch extends Component {

  handleClick() {
    const input = this.search;
    this.props.onSearch(input.value.trim());
  }

  render() {
    return (
      <div className="LibrarySearch">
        <input
          className="search"
          ref={ref => { this.search = ref; }}
          placeholder="Search"
          defaultValue={this.props.searchString}
        />
        <button
          onClick={evt => this.handleClick(evt)}
          className="clickable"
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
