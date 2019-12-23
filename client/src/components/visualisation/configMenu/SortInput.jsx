import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ButtonRowInput from './ButtonRowInput';
import ConfigMenuSectionOption from '../../common/ConfigMenu/ConfigMenuSectionOption';

export default function SortInput({ spec, onChangeSpec }) {
  return (
    <ConfigMenuSectionOption
      labelTextId="sort"
    >
      <ButtonRowInput
        options={[
          {
            value: undefined,
            label: <FormattedMessage id="none" />,
          },
          {
            value: 'asc',
            label: <FormattedMessage id="ascending" />,
          },
          {
            value: 'dsc',
            label: <FormattedMessage id="descending" />,
          },
        ]}
        selected={spec.sort ? spec.sort.toString() : undefined}
        onChange={sort => onChangeSpec({ sort })}
      />
    </ConfigMenuSectionOption>
  );
}

SortInput.propTypes = {
  spec: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};
