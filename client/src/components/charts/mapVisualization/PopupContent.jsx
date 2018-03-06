import React from 'react';
import PropTypes from 'prop-types';

const isImage = (value) => {
  // For now, treat every link as an image, until we have something like an "image-url" type
  if (typeof value === 'string' && value.match(/^https/) !== null) {
    return true;
  }
  return false;
};

const getColumnTitle = (titles, key) => titles.find(obj => obj.columnName === key).title;

const PopupContent = ({ data, singleMetadata, onImageLoad }) => {
  const getTitle = (key) => {
    const isMeta = key.substring(0, 1) === '_'; // We set meta columns to start with _ on backend

    if (isMeta) {
      return singleMetadata.shapeColorMappingTitle;
    }
    return getColumnTitle(singleMetadata.columnTitles, key);
  };

  return (
    <ul className="PopupContent">
      { Object.keys(data).sort().map(key =>
        <li
          key={key}
        >
          <h4>{getTitle(key)}</h4>
          <span>
            {isImage(data[key]) ?
              <a
                href={data[key]}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="imageContainer">
                  <img
                    src={data[key]}
                    role="presentation"
                    onLoad={onImageLoad}
                  />
                </div>
              </a>
                  :
              <span>
                {data[key] === null ? 'No data' : data[key]}
              </span>
            }
          </span>
        </li>
        )}
    </ul>
  );
};

PopupContent.propTypes = {
  data: PropTypes.object.isRequired,
  onImageLoad: PropTypes.func.isRequired,
  singleMetadata: PropTypes.object,
};

export default PopupContent;
