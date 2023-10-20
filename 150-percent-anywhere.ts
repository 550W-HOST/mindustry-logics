asm`set version "2.4"`;
asm`set state "init"`;

let item1: ItemSymbol = Items.phaseFabric;
let item2: ItemSymbol = Items.silicon;
let takeCount = 30;

const source = () => getCore();
const dest = () => getLink(0);

const currentItem = () => sensor(item2, dest()) > sensor(item1, dest()) ? item1 : item2;

let lastUnitCheck = 0;
let unitCheckFail = false;

main();

function main() {
    while (1) {
        // always release unit for a while
        if (Vars.unit) {
            reachBuilding(source());
            unitControl.unbind(); // not actually "unbind" from Vars.unit
        }
        setState("idle: release unit");
        wait(1);
        while (sensor(currentItem(), dest()) > dest().itemCapacity - takeCount) {
            setState("idle: dest almost full");
            wait(1);
        }
        bindAvailableUnit();
        // won't bind a new unit, unless it's dead or controlled by other processor

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
    while (1) {
        while (!Vars.unit || Vars.unit.dead || Vars.unit.controlled) {
            unitBind(Units.poly);
        }
        unitControl.idle();
        wait(0.5);
        if (Vars.unit.controller === Vars.this) break;
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
    let unitExists = Vars.unit;
    let unitDead = Vars.unit.dead;
    let unitControlled = Vars.unit.controlled;
    let unitController = Vars.unit.controller;
    let unitControlByThis = unitController === Vars.this;
    unitCheckFail = unitExists == undefined ||
        unitDead ||
        (unitControlled && unitControlled != ControlKind.ctrlProcessor) ||
        (unitControlled && !unitControlByThis);
    lastUnitCheck = Vars.time;
    if (unitCheckFail) {
        endScript();
    }
}

function setState(str: string) {
    asm`set state ${str}`
}
