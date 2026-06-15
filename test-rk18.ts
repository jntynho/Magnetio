import fs from 'fs';

const juan = JSON.parse(fs.readFileSync('juan_dump.json', 'utf-8'));
console.log('JWT:', juan.rawInstance?.jwt);
console.log('GatewayInstanceId:', juan.rawInstance?.gatewayInstanceId);
console.log('StoreId:', juan.rawInstance?.storeId);
console.log('NetworkId:', juan.rawInstance?.networkId);
console.log('siteId:', juan.rawInstance?.siteId);
