import React, { PropTypes } from 'react';
import { Map, CircleMarker, Popup, TileLayer } from 'react-leaflet';
import * as chart from '../../utilities/chart';

require('../../../node_modules/leaflet/dist/leaflet.css');
require('../../styles/MapVisualisation.scss');

const isImage = (value) => {
  /*
  if (typeof value !== 'string') {
    return false;
  }

  const lastChars = value.substring(value.length - 4, value.length);
  const tests = ['jpg', 'jpeg', 'gif', 'png', 'svg'];
  console.log(lastChars);

  return !tests.some(testValue => lastChars.indexOf(testValue) === -1);
  */
  if (typeof value === 'string' && value.match(/\.(jp(e?)g|png|gif)$/) !== null) {
    return true;
  }
  return false;
};

export default function MapVisualisation({ visualisation, datasets, width, height }) {
  const chartData = chart.getMapData(visualisation, datasets);
  const chartValues = chartData.values;
  const pointColorMapping = Object.keys(chartData.metadata.pointColorMapping).map(color => ({
    color,
    value: chartData.metadata.pointColorMapping[color],
  }));

  return (
    <div
      className="MapVisualisation dashChart"
      style={{
        position: 'relative',
        width,
        height,
      }}
    >
      {pointColorMapping.length >= 1 &&
        <div
          className="legend"
          style={{
            position: 'absolute',
            display: 'flex',
            left: '1rem',
            bottom: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            width: '10rem',
            height: '10rem',
            fontSize: '0.8rem',
            lineHeight: '1.4em',
            zIndex: 1,
          }}
        >
          <ul
            style={{
              padding: '0.5rem 1rem',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {pointColorMapping.map((mappingEntry, index) =>
              <li
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1,
                }}
              >
                <i
                  style={{
                    height: '0.5rem',
                    width: '0.5rem',
                    display: 'inline-block',
                    borderRadius: '10rem',
                    backgroundColor: mappingEntry.color,
                    opacity: 1,
                  }}
                />
                <span
                  style={{
                    marginLeft: '0.5em',
                  }}
                >
                  {mappingEntry.value}
                </span>
              </li>
            )}
          </ul>
        </div>
      }
      <Map
        center={[0, 0]}
        zoom={2}
        scrollWheelZoom={false}
        key={width}
        bounds={chartData.metadata.bounds}
        style={{
          width,
          height,
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
        />
        {
          chartValues.map((entry, index) =>
            <CircleMarker
              center={[entry.latitude, entry.longitude]}
              radius={4}
              color={entry.pointColor || '#000000'}
              fillOpacity="1"
              key={index}
            >
              {entry.popup.length > 0 &&
                <Popup>
                  <ul
                    style={{
                      position: 'relative',
                      minWidth: '12rem',
                    }}
                  >
                    {entry.popup.map((popupObject, popupIndex) =>
                      <li
                        key={popupIndex}
                        style={{
                          marginBottom: '0.5rem',
                        }}
                      >
                        <h4
                          style={{
                            fontWeight: 'bold',
                          }}
                        >{popupObject.title}</h4>
                        <span>
                          {isImage(popupObject.value) ?
                            <a
                              href={popupObject.value}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={popupObject.value}
                                role="presentation"
                                style={{
                                  width: '100%',
                                  imageOrientation: 'from-image',
                                }}
                              />
                            </a>
                            :
                            <span>
                              {popupObject.value}
                            </span>
                          }
                        </span>
                      </li>
                  )}
                  </ul>
                </Popup>
              }
            </CircleMarker>
          )
        }
      </Map>
    </div>
  );
}

MapVisualisation.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};
