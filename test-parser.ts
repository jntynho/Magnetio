import parse from 'torrent-name-parser';
const titles = [
  "SexMex.26.02.19.Coordinated.Desires.XXX.1080p",
  "Brazzers 21 05 20 Abella Danger And Johnny Sins In The Kitchen XXX 4K",
  "Reality Kings 19 01 15 Mia Khalifa Big Tit Surprise 1080p"
];
for (const t of titles) {
  console.log('Title:', t);
  console.log('Parsed:', parse(t));
}
