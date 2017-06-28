export default function fileName(source) {
  switch (source.kind) {
    case 'DATA_FILE':
      return source.fileName;
    case 'LINK':
      return source.url.substring(source.url.lastIndexOf('/') + 1);
    case 'AKVO_FLOW':
      return 'Survey';
    default:
      return 'Unknown';
  }
}
