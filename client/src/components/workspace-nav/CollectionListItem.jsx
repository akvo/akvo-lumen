import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { updateCollectionLocation } from '../../actions/collectionHistory';

require('./CollectionListItem.scss');

// eslint-disable-next-line max-len
function CollectionListItem({ collection, onDeleteCollection, pathname, setCurrentCollectionLocation }) {
  const isActive = pathname.indexOf(`${collection.id}`) > -1;
  const className = isActive ? 'selected' : null;

  return (
    <div className="CollectionListItem">
      <Link
        onClick={() => setCurrentCollectionLocation(`/library/collections/${collection.id}`)}
        to={`/library/collections/${collection.id}`}
        className={className}
      >
        {collection.title}
      </Link>
      <button
        className="delete clickable"
        onClick={() => onDeleteCollection(collection)}
      >
        ✖
      </button>
    </div>
  );
}

const mapDispatchToProps = dispatch => ({
  setCurrentCollectionLocation: location => dispatch(updateCollectionLocation(location)),
});

CollectionListItem.propTypes = {
  collection: PropTypes.object,
  setCurrentCollectionLocation: PropTypes.func,
  pathname: PropTypes.string.isRequired,
  onDeleteCollection: PropTypes.func.isRequired,
};

export default connect(null, mapDispatchToProps)(CollectionListItem);
