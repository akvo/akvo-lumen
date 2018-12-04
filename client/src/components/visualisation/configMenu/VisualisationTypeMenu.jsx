/* eslint-disable global-require, import/no-dynamic-require */
import React from 'react';
import PropTypes from 'prop-types';
import { kebabCase } from 'lodash';
import { injectIntl, intlShape } from 'react-intl';

import visualisationTypes from '../../../constants/Visualisation/visualisationTypes';
import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ConfigMenuSectionOptionThumbs from '../../common/ConfigMenu/ConfigMenuSectionOptionThumbs';

require('./VisualisationTypeMenu.scss');

function VisualisationTypeMenu({ visualisation, onChangeVisualisationType, intl }) {
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
              label: intl.formatMessage({ id: type }),
              imageSrc: require(`../../../styles/img/icon-128-visualisation-${kebabType}.png`),
              onClick: () => onChangeVisualisationType(type),
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
  intl: intlShape,
  visualisation: PropTypes.object.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
};

export default injectIntl(VisualisationTypeMenu);
