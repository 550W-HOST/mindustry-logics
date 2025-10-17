let GLOBALTARGET = undefined;
main();

function main() {
    while (1) {
        unitBind(Units.antumbra);
        if ((Vars.unit.health / Vars.unit.maxHealth) < 0.5) {
            const { x, y } = getRepair();
            unitControl.approach({ x, y, radius: 5 });
            wait(0.1);
            continue;
        }

        unitControl.flag(150);
        const [found, x, y, core] = unitLocate.spawn();

        if (!found) {
            continue;
        }
        if (core) {
            print`core location at (${x}, ${y})`;
        } else {
            print`enemy spawn at (${x}, ${y})`;
        }
        printFlush();

        let enemy = unitRadar({
            filters: ["enemy", "any", "any"],
            order: true,
            sort: "distance",
        });

        if (!enemy) {
            if (GLOBALTARGET) {
                enemy = GLOBALTARGET;
            } else {
                if (!unitControl.within({ x, y, radius: 45 })) {
                    unitControl.approach({ x, y, radius: 45 });
                    wait(0.05);
                } else {
                    unitControl.approach({ x: Vars.thisx, y: Vars.thisy, radius: 45 });
                    wait(0.05);
                 }
                continue
            }
        } else { 
            GLOBALTARGET = enemy;
        }

        const { x: ex, y: ey } = enemy;
        unitControl.approach({ x: ex, y: ey, radius: Vars.unit.range - 5 });

        if (!enemy.dead) {
            unitControl.targetp({
                shoot: true,
                unit: enemy,
            });
        } else { 
            GLOBALTARGET = undefined;
        }
        wait(0.1);
    }
}

function getRepair() { 
    const [, , , building] = unitLocate.building({ group: 'repair', enemy: false });
    return building;
}
