import React, { PropTypes } from 'react';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';
import * as chart from '../../utilities/chart';

require('../../../node_modules/leaflet/dist/leaflet.css');
require('../../styles/MapVisualisation.scss');


export default function MapVisualisation({ visualisation, datasets, width, height }) {
  const chartData = chart.getChartData(visualisation, datasets)[0];

  return (
    <div className="MapVisualisation dashChart">
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
          chartData.values.map((entry, index) =>
            <Marker
              position={[parseFloat(entry.x), parseFloat(entry.y)]}
              key={index}
            >
              {
                entry.label &&
                  <Popup>
                    <span>{entry.label}</span>
                  </Popup>
              }
            </Marker>
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
