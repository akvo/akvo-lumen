/* eslint-disable global-require, import/no-dynamic-require */
import React from 'react';
import PropTypes from 'prop-types';
import { kebabCase } from 'lodash';
import { injectIntl, intlShape } from 'react-intl';

import visualisationTypes from '../../../constants/Visualisation/visualisationTypes';
import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ConfigMenuSectionOptionThumbs from '../../common/ConfigMenu/ConfigMenuSectionOptionThumbs';
import { SELECT_VISUALISATION_TYPE } from '../../../constants/analytics';
import IMAGES from '../../../constants/images';
import { trackEvent } from '../../../utilities/analytics';

require('./VisualisationTypeMenu.scss');

function VisualisationTypeMenu({ visualisation, onChangeVisualisationType, intl }) {
  return (
    <ConfigMenuSection
      className="VisualisationTypeMenu"
      title="visualisation_type"
      options={(
        <ConfigMenuSectionOptionThumbs
          id="visualisation_type"
          items={visualisationTypes.map(type => ({
            label: intl.formatMessage({ id: type }),
            imageSrc: IMAGES.VISUALISATION[type] || '',
            onClick: () => {
              trackEvent(SELECT_VISUALISATION_TYPE, type);
              return onChangeVisualisationType(type);
            },
            selected: visualisation.visualisationType === type,
            testId: `visualisation-type-${kebabCase(type)}`,
          }))}
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
