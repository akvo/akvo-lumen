export default function getArrayFromObject(object) {
  return Object.keys(object).map(key => object[key]);
}
