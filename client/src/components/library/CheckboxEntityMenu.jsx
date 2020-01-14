import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ContextMenu from '../common/ContextMenu';
import { count } from '../../utilities/collection';

require('./CheckboxEntityMenu.scss');

export default class CheckboxEntityMenu extends Component {
  constructor() {
    super();
    this.state = {
      menuActive: false,
    };
    this.handleAddEntitiesToCollection = this.handleAddEntitiesToCollection.bind(this);
    this.handleRemoveEntitiesFromCollection = this.handleRemoveEntitiesFromCollection.bind(this);
  }
  handleAddEntitiesToCollection(collectionId) {
    if (collectionId === 'newCollection') {
      this.props.onCreateCollection(this.props.checkboxEntities);
    } else {
      this.props.onAddEntitiesToCollection(this.props.checkboxEntities, collectionId);
    }
    this.props.onDeselectEntities();
  }
  handleRemoveEntitiesFromCollection() {
    const { props } = this;
    props.onRemoveEntitiesFromCollection(props.checkboxEntities, props.collection.id);
    props.onDeselectEntities();
  }
  render() {
    const { props } = this;
    const { collections, collection } = props;
    return (
      <div className="CheckboxEntityMenu offscreen">
        <span className="SelectCount">
          {count(props.checkboxEntities)} Selected
        </span>

        <span
          style={{
            position: 'relative',
          }}
        >
          {collection ?
            <span>
              <button
                data-test-id="remove-from-collection"
                className="removeFromCollection clickable"
                onClick={this.handleRemoveEntitiesFromCollection}
              >
                Remove from collection
              </button>
            </span>
            :
            <span>
              <button
                data-test-id="dataset-add-to-collection"
                className="addToCollection clickable"
                onClick={() => this.setState({ menuActive: !this.state.menuActive })}
              >
                Add to collection
              </button>
              {this.state.menuActive &&
                <ContextMenu
                  onOptionSelected={this.handleAddEntitiesToCollection}
                  onWindowClick={() => this.setState({ menuActive: false })}
                  options={[
                    ...Object.keys(collections).map(key => ({
                      value: key,
                      label: collections[key].title,
                    })),
                    {
                      value: 'newCollection',
                      label: 'New Collection',
                      customClass: 'newCollection',
                    },
                  ]}
                />
              }
            </span>
          }
        </span>
        <button
          data-test-id="delete-dataset"
          className="delete clickable notImplemented"
        >
          Delete
        </button>
        <button
          className="deselect clickable"
          onClick={props.onDeselectEntities}
        >
          Deselect
        </button>
      </div>
    );
  }
}

CheckboxEntityMenu.propTypes = {
  onCreateCollection: PropTypes.func.isRequired,
  onAddEntitiesToCollection: PropTypes.func.isRequired,
  onRemoveEntitiesFromCollection: PropTypes.func.isRequired,
  onDeselectEntities: PropTypes.func.isRequired,
  checkboxEntities: PropTypes.object.isRequired,
  collection: PropTypes.object,
};
