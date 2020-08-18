import React from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'react-grid-system';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';

import { filterColumns, columnSelectOptions, columnSelectSelectedOption } from '../../../utilities/column';

import SelectMenu from '../../common/SelectMenu';

import './SourceDeriveCategoryOptions.scss';

const SourceDeriveCategoryOptions = ({ dataset, onChange, selected, intl }) => {
  const columnsSelect = filterColumns(dataset.columns, ['text', 'number', 'option']);
  return (
    <Container className="SourceDeriveCategoryOptions">
      <Row>
        <Col md={6} offset={{ md: 3 }}>
          <h2>
            <FormattedMessage id="select_source_column" />
          </h2>
          {dataset.columns && (
            <SelectMenu
              name="sourceColumnName"
              value={columnSelectSelectedOption(selected, columnsSelect)}
              searchable
              options={columnSelectOptions(intl, columnsSelect)}
              onChange={onChange}
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default injectIntl(SourceDeriveCategoryOptions);

SourceDeriveCategoryOptions.propTypes = {
  dataset: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.string,
  intl: intlShape,
};
