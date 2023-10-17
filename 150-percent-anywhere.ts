let sourceX = 0; // 0 for core
let sourceY = 0;

let destX = getLink(0).x;
let destY = getLink(0).y;

let item1 = Items.phaseFabric;
let item2 = Items.silicon;
let count = 20;


do {
    unitBind(Units.poly);
} while (!Vars.unit || Vars.unit.controlled);
unitControl.flag(150);

if (!sourceX && !sourceY) {
    const [found, coreX, coreY] = unitLocate.building({ group: 'core', enemy: false });
    if (!found) endScript();
    sourceX = coreX;
    sourceY = coreY;
}

if (Vars.unit.totalItems > 0) {
    unitControl.itemDrop(Blocks.air, 999);
}

let currentItem = item1;

while (1) {
    unitControl.itemTake(reachBuilding(sourceX, sourceY), currentItem, count);
    while (Vars.unit.totalItems) {
        checkAlive();
        unitControl.itemDrop(reachBuilding(destX, destY), Vars.unit.totalItems);
    }
    checkAlive();
    currentItem = currentItem == item1 ? item2 : item1;
}

function reachBuilding(x: number, y: number) {
    while (!unitControl.within({ x, y, radius: 6 })) {
        checkAlive();
        unitControl.approach({ x, y, radius: 6 });
    }
    return unitControl.getBlock(x, y)[1];
}

function checkAlive() {
    if (!Vars.unit) {
        endScript();
    }
}
