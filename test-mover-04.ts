var unitFlag = 114514191;

function bindFreeUnit(unitType, tryBind = false) {
    var first = undefined;
    while (true) {
        unitBind(unitType)
        if (first === undefined) {
            first = Vars.unit;
        } else if (first == Vars.unit) {
            break;
        }
        if (Vars.unit.controller == Vars.this) {
            unitControl.flag(unitFlag)
            print`Recovered possession of ${Vars.unit}\n`
            printFlush()
            return true;
        }
    }

    while (true) {
        unitBind(unitType)
        if (Vars.unit.controlled && Vars.unit.controller != Vars.this) {
            // continue
        } else {
            unitControl.flag(unitFlag)
            wait(1 + Math.rand(0.5))
            if (Vars.unit.controller == Vars.this) {
                print`Bound to ${Vars.unit}\n`
                printFlush()
                return true;
            }
        }

        if (tryBind && Vars.unit == first) {
            break;
        }
    }
    print`Unable to bind to ${unitType}`
    printFlush()
    return undefined;
}

function checkUnitPossession() {
    unitControl.flag(unitFlag)
    var ctlr = Vars.unit.controller
    if (ctlr != Vars.this) {
        print`Possession taken by ${ctlr} @${ctlr.x}, ${ctlr.y}\n`
        printFlush()
        stopScript()
        // endScript()
    }
}

function waitUntilStop() {
    var px = -1;
    var py = -1;

    while (true) {
        var nx = Vars.unit.x;
        var ny = Vars.unit.y;
        if (Math.abs(nx - px) + Math.abs(ny - py) < 0.1) {
            return;
        }
        px = nx;
        py = ny;
    }
}

function reach(tx, ty) {
    do {
        // unitControl.move(tx, ty);
        unitControl.approach({ x: tx, y: ty, radius: 5 })
        wait(0.5)
    } while (!unitControl.within({ x: tx, y: ty, radius: 5 }));
}

print(); printFlush()

bindFreeUnit(Units.poly, true) ?? bindFreeUnit(Units.mega, true) ?? bindFreeUnit(Units.alpha)

var ox = Vars.unit.x;
var oy = Vars.unit.y;

while (true) {
    var [, cx, cy, core] = unitLocate.building({
        group: "core",
        enemy: false,
    })

    reach(cx, cy)
    waitUntilStop()

    unitControl.itemTake(core, Items.copper, 20)
    while (Vars.unit.totalItems == 0);

    reach(320, 144)
    waitUntilStop()
    var [, vault,] = unitControl.getBlock(320, 144)
    do { unitControl.itemDrop(vault, 999) }
    while (Vars.unit.totalItems != 0);

}

