function parseJavId(urlId) {
  const match = urlId.match(/^([a-z]+)[^0-9a-z]*0*([0-9]+)$/i);
  if (match) {
    let num = match[2];
    while(num.length < 3 && urlId.match(/^([a-z]+)0+([0-9]+)$/i)) {
      num = '0' + num;
    }
    return `${match[1].toUpperCase()}-${num.padStart(3, '0')}`;
  }
  return urlId.toUpperCase();
}
console.log(parseJavId('mida00402'));
console.log(parseJavId('snos00280'));
console.log(parseJavId('manx00007'));
console.log(parseJavId('rki00694'));
