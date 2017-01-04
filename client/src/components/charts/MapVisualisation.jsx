import React, { PropTypes } from 'react';
import { Map, CircleMarker, Popup, TileLayer } from 'react-leaflet';
import * as chart from '../../utilities/chart';

require('../../../node_modules/leaflet/dist/leaflet.css');
require('../../styles/MapVisualisation.scss');


export default function MapVisualisation({ visualisation, datasets, width, height }) {
  const chartData = chart.getChartData(visualisation, datasets)[0];
  const colorKeyArray = Object.keys(visualisation.spec.pointColorKey).map(key =>
    ({
      category: key,
      color: visualisation.spec.pointColorKey[key],
    })
  );

  return (
    <div
      className="MapVisualisation dashChart"
      style={{
        position: 'relative',
        width,
        height,
      }}
    >
      {colorKeyArray.length > 1 &&
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
            {colorKeyArray.map((colorKey, index) =>
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
                    backgroundColor: colorKey.color,
                    opacity: 0.5,
                  }}
                />
                <span
                  style={{
                    marginLeft: '0.5em',
                  }}
                >
                  {colorKey.category}
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
          chartData.values
            .filter(entry => entry.x != null && entry.y != null)
            .map((entry, index) =>
              <CircleMarker
                center={[entry.x, entry.y]}
                radius={3}
                color={entry.pointColor || '#000000'}
                fillOpacity="0.5"
                key={index}
              >
                {
                  entry.datapointLabelValue &&
                    <Popup>
                      <span>{entry.datapointLabelValue}</span>
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
