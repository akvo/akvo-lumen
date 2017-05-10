import React, { Component, PropTypes } from 'react';
import ContextMenu from '../common/ContextMenu';

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
  handleRemoveEntitiesFromCollection(collectionId) {
    this.props.onRemoveEntitiesFromCollection(this.props.checkboxEntities, this.props.collection.id);
    this.props.onDeselectEntities();
  }
  render() {
    const { props } = this;
    const { collections } = props;
    return (
      <div className="CheckboxEntityMenu">
        <span>
          {props.checkboxEntities.length} Selected
        </span>
        <span
          style={{
            position: 'relative',
          }}
        >
          {this.props.collection ?
            <span>
              <button
                className="removeFromCollection clickable"
                onClick={this.handleRemoveEntitiesFromCollection}
              >
                Remove from collection
              </button>
            </span>
            :
            <span>
              <button
                className="addToCollection clickable"
                onClick={() => this.setState({ menuActive: !this.state.menuActive })}
              >
                Add to collection ▾
              </button>
              {this.state.menuActive &&
                <ContextMenu
                  style={{
                    marginTop: '-1em',
                  }}
                  onOptionSelected={this.handleAddEntitiesToCollection}
                  onWindowClick={() => this.setState({ menuActive: !this.state.menuActive })}
                  options={[
                    ...Object.keys(collections).map(key => ({
                      value: key,
                      label: collections[key].name,
                    })),
                    {
                      value: 'newCollection',
                      label: 'New Collection',
                    },
                  ]}
                />
              }
            </span>
          }
        </span>
        <button
          className="delete clickable"
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
