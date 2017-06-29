export default function getArrowStyle(className, offset = '0px') {
  const style = {};
  let direction;

  switch (className) {
    case 'topLeft':
    case 'bottomLeft':
      direction = 'left';
      break;

    case 'topRight':
    case 'bottomRight':
      direction = 'right';
      break;

    default:
      throw new Error(`Unknown direction ${className} supplied to getArrowStyle`);
  }

  style[direction] = offset;

  return style;
}
