main();

function main() {
    while (1) {
        unitBind(Units.mega);
        if ((Vars.unit.health / Vars.unit.maxHealth) < 0.5) {
            const { x, y } = getRepair();
            while (!unitControl.within({ x, y, radius: 5 })) { 
                unitControl.approach({ x, y, radius: 5 });
            }
            wait(0.1);
        }
        unitControl.unbind();
        unitBind(Units.poly);
        if ((Vars.unit.health / Vars.unit.maxHealth) < 0.5) {
            const { x, y } = getRepair();
            while (!unitControl.within({ x, y, radius: 5 })) {
                unitControl.approach({ x, y, radius: 5 });
            }
            wait(0.1);
        }
        unitControl.unbind();
    }
}

function getRepair() { 
    const [, , , building] = unitLocate.building({ group: 'repair', enemy: false });
    return building;
}
