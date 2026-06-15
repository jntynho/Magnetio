import fs from 'fs';

function main() {
    const rawInst = JSON.parse(fs.readFileSync('rawInstance.json', 'utf8'));
    const routeList = rawInst.routeList || {};
    
    console.log("routeList keys:", Object.keys(routeList));
    if (routeList.routes) {
        console.log(`Found ${routeList.routes.length} routes in routeList.routes.`);
        routeList.routes.forEach((route: any, index: number) => {
            console.log(`- Route #${index}: path="${route.path}", structureId=${route.structureId}`);
            if (JSON.stringify(route).includes('actor') || JSON.stringify(route).includes('model')) {
                console.log(`  MATCH:`, JSON.stringify(route, null, 2));
            }
        });
    }
}

main();
