import React from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'react-grid-system';
import { FormattedMessage, injectIntl } from 'react-intl';
import queryString from 'querystringify';

import SelectMenu from '../../common/SelectMenu';

import './SourceDeriveCategoryOptions.scss';

function conditionColumn({ type }) {
  const showCategoryTransform = queryString.parse(location.search)['show-category-number-transform'] === '1';
  let res;
  if (showCategoryTransform) {
    res = type === 'text' || type === 'number';
  } else {
    res = type === 'text';
  }
  return res;
}

const SourceDeriveCategoryOptions = ({ dataset, onChange, selected }) => (
  <Container className="SourceDeriveCategoryOptions">
    <Row>
      <Col md={6} offset={{ md: 3 }}>
        <h2>
          <FormattedMessage id="select_source_column" />
        </h2>
        {dataset.columns && (
          <SelectMenu
            name="sourceColumnName"
            value={selected}
            searchable
            options={
              dataset.columns.filter(conditionColumn)
                .map(({ columnName, title, type }) => ({
                  value: columnName,
                  label: `${title} (${type})`,
                }))
            }
            onChange={onChange}
          />
        )}
      </Col>
    </Row>
  </Container>
);

export default injectIntl(SourceDeriveCategoryOptions);

SourceDeriveCategoryOptions.propTypes = {
  dataset: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.string,
};
