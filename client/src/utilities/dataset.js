import moment from 'moment';

const formatCellValue = (type, value) => {
  switch (type) {
    case 'date':
      return value == null ? null : moment(value).format();
    default:
      return value;
  }
};

const fileName = (source) => {
  switch (source.kind) {
    case 'DATA_FILE':
      return source.fileName;
    case 'LINK':
      return source.url.substring(source.url.lastIndexOf('/') + 1);
    case 'AKVO_FLOW':
      return 'Survey';
    default: return 'Unknown';
  }
};

export default { formatCellValue, fileName };
