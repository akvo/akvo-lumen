import React, { Component, PropTypes } from 'react';
import LibraryListingItem from './LibraryListingItem';

export default class LibraryListingGroup extends Component {
  render() {
    const listGroupDate = new Date(Date.parse(this.props.listGroup.listGroupDate));
    const listGroupTitle = listGroupDate.toUTCString(); // TODO: format this

    return (
      <div className="LibraryListingGroup">
        {this.props.isSortDateType &&
          <h3>{listGroupTitle}</h3>
        }
        <ol>
          {this.props.listGroup.entities.map((entity, index) =>
            <LibraryListingItem
              key={index}
              entity={entity}
              displayMode={this.props.displayMode}
            />
          )}
        </ol>
      </div>
    );
  }
}

LibraryListingGroup.propTypes = {
  listGroup: PropTypes.shape({
      listGroupDate: PropTypes.string.isRequired,
      entities: PropTypes.array,
    }),
  displayMode: PropTypes.oneOf(['list', 'grid']).isRequired,
  isSortDateType: PropTypes.bool.isRequired,
};
