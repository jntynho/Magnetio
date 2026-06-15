function parseJavId(urlId) {
  const match = urlId.match(/^([a-z]+)0*([0-9]+)$/i);
  if (match) {
    return `${match[1].toUpperCase()}-${match[2]}`;
  }
  return urlId.toUpperCase();
}
console.log(parseJavId('mida00402'));
console.log(parseJavId('snos00280'));
console.log(parseJavId('manx00007'));
console.log(parseJavId('rki00694'));
