/* eslint-disable global-require, import/no-dynamic-require */
import React from 'react';
import PropTypes from 'prop-types';
import { kebabCase } from 'lodash';

import visualisationTypes from '../../../constants/Visualisation/visualisationTypes';
import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ConfigMenuSectionOptionThumbs from '../../common/ConfigMenu/ConfigMenuSectionOptionThumbs';
import { SELECT_VISUALISATION_TYPE } from '../../../constants/analytics';
import { trackEvent } from '../../../utilities/analytics';

require('./VisualisationTypeMenu.scss');

export default function VisualisationTypeMenu({ visualisation, onChangeVisualisationType }) {
  return (
    <ConfigMenuSection
      className="VisualisationTypeMenu"
      title="visualisation_type"
      options={(
        <ConfigMenuSectionOptionThumbs
          id="visualisation_type"
          items={visualisationTypes.map((type) => {
            const kebabType = kebabCase(type);
            return {
              label: type,
              imageSrc: require(`../../../styles/img/icon-128-visualisation-${kebabType}.png`),
              onClick: () => {
                trackEvent(SELECT_VISUALISATION_TYPE, type);
                return onChangeVisualisationType(type);
              },
              selected: visualisation.visualisationType === type,
              testId: `visualisation-type-${kebabType}`,
            };
          })}
        />
      )}
    />
  );
}

VisualisationTypeMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
};
