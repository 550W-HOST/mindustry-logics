asm`set version "2.1"`;
asm`set state "init"`;

let item1: ItemSymbol = Items.phaseFabric;
let item2: ItemSymbol = Items.silicon;
let takeCount = 30;

const source = () => getCore();
const dest = () => getLink(0);

const currentItem = () => sensor(item2, dest()) > sensor(item1, dest()) ? item1 : item2;

main();

function main() {
    while (1) {
        // idle
        if (sensor(currentItem(), dest()) > dest().itemCapacity - takeCount) {
            setState("idle: dest almost full");
            if (Vars.unit) {
                reachBuilding(source());
                unitControl.unbind(); // not actually "unbind" from Vars.unit
            }
            while (sensor(currentItem(), dest()) > dest().itemCapacity - takeCount) {
                wait(1);
            }
            bindAvailableUnit();
            // won't bind a new unit, unless it's dead or controlled by other processor
        }

        if (!Vars.unit) {
            bindAvailableUnit();
        }

        // discard useless items
        if (Vars.unit.totalItems > 0 && Vars.unit.firstItem != currentItem()) {
            unitControl.itemDrop(Blocks.air, 999);
            wait(0.2);
        }

        // take
        if (Vars.unit.totalItems < takeCount) {
            setState("take from source");
            unitControl.itemTake(reachBuilding(source()), currentItem(), takeCount - Vars.unit.totalItems);
        }

        // drop
        while (Vars.unit.totalItems) {
            setState("drop into dest");
            checkAlive();
            unitControl.itemDrop(reachBuilding(dest()), Vars.unit.totalItems);

            if (sensor(currentItem(), dest()) == dest().itemCapacity) {
                break;
            }
        }
    }
}

function bindAvailableUnit() {
    setState("bind unit");
    while (!Vars.unit || Vars.unit.dead || Vars.unit.controlled) {
        unitBind(Units.poly);
    }
    unitControl.flag(150);
}

function reachBuilding(building: AnyBuilding) {
    const { x, y } = building;
    while (!unitControl.within({ x, y, radius: 6 })) {
        checkAlive();
        unitControl.approach({ x, y, radius: 4 });
    }
    return building;
}

function getCore() {
    const [, , , building] = unitLocate.building({ group: 'core', enemy: false });
    return building;
}

function checkAlive() {
    if (!Vars.unit || Vars.unit.dead) {
        endScript();
    }
}

function setState(str: string) {
    asm`set state ${str}`
}
