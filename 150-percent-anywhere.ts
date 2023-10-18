let item1 = Items.phaseFabric;
let item2 = Items.silicon;
let count = 20;

const source = () => reachBuilding(getCore());
// const source = () => reachXY(114, 514);
const dest = () => reachBuilding(getLink(0));

main();

function main() {
    do {
        unitBind(Units.poly);
    } while (!Vars.unit || Vars.unit.controlled);
    unitControl.flag(150);

    if (Vars.unit.totalItems > 0) {
        unitControl.itemDrop(Blocks.air, 999);
    }

    let currentItem = item1;

    while (1) {
        checkAlive();
        unitControl.itemTake(source(), currentItem, count);
        while (Vars.unit.totalItems) {
            checkAlive();
            unitControl.itemDrop(dest(), Vars.unit.totalItems);
        }
        currentItem = currentItem == item1 ? item2 : item1;
    }
}

function reachXY(x: number, y: number) {
    while (!unitControl.within({ x, y, radius: 6 })) {
        checkAlive();
        unitControl.approach({ x, y, radius: 6 });
    }
    return unitControl.getBlock(x, y)[1];
}

function reachBuilding(building: AnyBuilding) {
    const { x, y } = building;
    while (!unitControl.within({ x, y, radius: 6 })) {
        checkAlive();
        unitControl.approach({ x, y, radius: 6 });
    }
    return building;
}

function getCore() {
    const [, , , building] = unitLocate.building({ group: 'core', enemy: false });
    return building;
}

function checkAlive() {
    if (!Vars.unit) {
        endScript();
    }
}
