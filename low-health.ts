let lastUnitCheck = 0;
let unitCheckFail = false;

main();

function main() {
    while (1) {
        unitBind(Units.mega);
        checkAlive();
        if ((Vars.unit.health / Vars.unit.maxHealth) < 1.2) {
            const { x, y } = getRepair();
            while (!unitControl.within({ x, y, radius: 5 })) { 
                unitControl.approach({ x, y, radius: 5 });
            }
            wait(0.1);
        }
        unitControl.unbind();
        unitBind(Units.poly);
        checkAlive();
        if ((Vars.unit.health / Vars.unit.maxHealth) < 0.5) {
            const { x, y } = getRepair();
            while (!unitControl.within({ x, y, radius: 5 })) {
                unitControl.approach({ x, y, radius: 5 });
            }
            wait(0.1);
        }
        unitControl.unbind();
        wait(1);
    }
}

function getRepair() { 
    const [, , , building] = unitLocate.building({ group: 'repair', enemy: false });
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
