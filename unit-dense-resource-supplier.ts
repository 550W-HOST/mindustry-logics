// stable

var dropCount = 999

var unitFlag = 140000 + Math.rand(999)

const config = {
    waypoints: new MutableArray([
        158, 322, 267, 322, 
        151, 320, 151, 387,
        // 272, 124, 343, 124,
        // 299, 127, 272, 127
    ]),
    itemTypes: new MutableArray([
        Items.phaseFabric
    ]),
    acceptedBlocks: new MutableArray([
        Blocks.forceProjector,
        Blocks.mendProjector,
        Blocks.overdriveProjector,
        Blocks.overdriveDome
    ]),
    // radius: 1
}

var coreX = undefined;
var coreY = undefined;
var core = undefined;

var unitItemCapacity = undefined;
var unitRange = undefined;

main()

function main() {
    print(' -- ')
    printFlush()
    bindFreeUnit(Units.mega, true)
        ?? bindFreeUnit(Units.poly, true)
        ?? bindFreeUnit(Units.mono, true)
        ?? reportBindFailure();
    print`Bound to a ${Vars.unit}\n`
    printFlush()
    wait(1)

    init()

    while (true) {
        for (var itemIndex = 0; itemIndex < config.itemTypes.size; itemIndex++) {
            print`Trying to fill ${config.itemTypes[itemIndex]}`
            printFlush()
            doFill(config.itemTypes[itemIndex])
        }
    }
}

function doFill(itemType) {
    var waypointCnts = Math.idiv(config.waypoints.size, 4)
    for (var waypointIndex = 0; waypointIndex < waypointCnts; waypointIndex++) {
        var bi = waypointIndex * 4;
        var bx = config.waypoints[bi++];
        var by = config.waypoints[bi++];
        var ex = config.waypoints[bi++];
        var ey = config.waypoints[bi++];
        print`Ready to scan [green]${bx}->${ex}, ${by}->${ey}`
        printFlush()
        wait(0.5)

        var lastBuilding = undefined;

        var dx = ex - bx
        var dy = ey - by

        var stepCnt = Math.max(Math.abs(dx), Math.abs(dy))
        var vx = dx / stepCnt
        var vy = dy / stepCnt

        var pxFloat = bx;
        var pyFloat = by;
        for (var step = 0; step <= stepCnt; step++, pxFloat += vx, pyFloat += vy) {
            var px = Math.floor(pxFloat + 0.5)
            var py = Math.floor(pyFloat + 0.5)
            print`[blue]Scanning ${px}, ${py}\n${pxFloat}, ${pyFloat}`
            printFlush()
            // wait(0.5)
            // continue

            if (Vars.unit.totalItems == 0 || Vars.unit.firstItem != itemType) {
                print`Fetch ${itemType} from home`
                printFlush()

                if (!fetchItemFromCore(itemType)) return;
            }

            var typ, building;
            while (true) {
                [typ, building,] = unitControl.getBlock(px, py)
                if (typ !== undefined) break;
                doUnitApproachAndWait(px, py)
                print`[accent]Cannot get block info on ${px}, ${py}`
                printFlush()
            }

            if (building == lastBuilding) continue;

            if (isAcceptedBlockType(typ)) {
                approachIfNecessary(px, py, 4)
                print`[orange]Dropping at ${px}, ${py}\n${pxFloat}, ${pyFloat}`
                printFlush()
                if (!ensureDrop(building, dropCount)) {
                    print`[red]Drop timeout exceeded.`
                    printFlush()
                    wait(0.5)
                }
            }

            checkUnitAvailability()
            selfHealIfNecessary()
            lastBuilding = building
        }

    }

}

function ensureDrop(building, count) {
    var unitItemType = Vars.unit.firstItem;
    var dropUntil = Math.max(Vars.unit.totalItems - (building.itemCapacity - building[unitItemType]), Vars.unit.totalItems - count)
    dropUntil = Math.max(dropUntil, 0)
    var timeout = Vars.time + 5000
    while (Vars.time < timeout && Vars.unit.totalItems > dropUntil) {
        unitControl.itemDrop(building, Vars.unit.totalItems - dropUntil)
        wait(0.3)
    }
    return Vars.unit.totalItems <= dropUntil
}

function isAcceptedBlockType(typ) {
    for (var i = 0; i < config.acceptedBlocks.size; i++) {
        if (typ == config.acceptedBlocks[i]) return true;
    }
    return false;
}

function checkUnitAvailability() {
    unitControl.flag(unitFlag)
    var ctlr = Vars.unit.controller
    if (ctlr != Vars.this) {
        print`[red]Possession taken by ${ctlr} @${ctlr.x}, ${ctlr.y}\n`
        printFlush()
        // stopScript()
        endScript()
    } else if (Vars.unit.dead) {
        endScript()
    }
}

function selfHealIfNecessary() {
    if (Vars.unit.health > 0.5 * Vars.unit.maxHealth) return;

    var [found, x, y,] = unitLocate.building(
        {
            group: "repair",
            enemy: false
        }
    )

    if (!found) return;

    print`[accent]Seeking repairment @${x}, ${y}`
    printFlush()

    doUnitApproachAndWait(x, y);
    print`[green][accent]Repairing @${x}, ${y}`
    printFlush()
    var timeout = Vars.time + 10000;
    while (Vars.unit.health < 0.9 * Vars.unit.maxHealth && Vars.time < timeout);
}

function waitUntilStop() {
    var px = -1;
    var py = -1;
    var lastTime = Vars.time;

    while (true) {
        var nx = Vars.unit.x;
        var ny = Vars.unit.y;
        var time = Vars.time;
        if ((Math.abs(nx - px) + Math.abs(ny - py)) / lastTime < 1 / 1000) {
            return;
        }
        px = nx;
        py = ny;
        lastTime = time;
    }
}

function init() {
    var [found, x, y, _core] = unitLocate.building({
        group: "core",
        enemy: false
    })

    if (!found) {
        print`Failed to locate a core\n`; printFlush()
        endScript()
    }

    coreX = x
    coreY = y;
    core = _core;

    unitItemCapacity = Vars.unit.itemCapacity;
    unitRange = Vars.unit.range;
}


function bindFreeUnit(unitType, tryBind = false) {
    print`Trying to recover possession of ${unitType}`
    printFlush()
    var first = undefined;
    var ttl = 64;
    while (ttl--) {
        unitBind(unitType)
        if (Vars.unit === undefined) break;
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

    print`Trying to bind to a new ${unitType} \nprevious ttl=${ttl}`
    printFlush()
    ttl = 64;
    while (true) {
        unitBind(unitType)
        if (Vars.unit === undefined) break;
        if (Vars.unit.controlled && Vars.unit.controller != Vars.this) {
            // continue
        } else {
            unitControl.flag(unitFlag)
            print`Checking exclusive access to ${Vars.unit}`
            printFlush()
            wait(1 + Math.rand(0.5))
            if (Vars.unit.controller == Vars.this) {
                print`Bound to ${Vars.unit}\n`
                printFlush()
                return true;
            }
        }

        if (tryBind && (ttl-- <= 0 || Vars.unit == first)) {
            break;
        }
    }
    print`Unable to bind to ${unitType}\nprevious ttl=${ttl}`
    printFlush()
    return undefined;
}

function reportBindFailure() {
    print`Failed to bind to a unit`
    printFlush()
    endScript()
}

// function fastUnitWithin({x, y, radius}) {
//     var dx = x - Vars.unit.x
//     var dy = y - Vars.unit.y;
//     return Math.sqrt(dx * dx + dy * dy) < radius
// }

function approachIfNecessary(x, y, radius) {
    if (unitControl.within({ x: x, y: y, radius: radius })) return;
    doUnitApproachAndWait(x, y)
}

function doUnitApproachAndWait(x, y) {
    print`En route to (${x}, ${y})\n`; printFlush()
    do {
        // unitControl.approach({ x: x, y: y, radius: 3 })
        unitControl.move(x, y)
        wait(0.1)
        // wait(3)
    } while (!unitControl.within({ x: x, y: y, radius: 3 }));
    print`En route to (${x}, ${y}) - waiting`; printFlush()
    // waitUntilStop()
    // wait(3)
}

function fetchItemFromCore(itemType) {
    print`On way of [accent]${itemType} (x${unitItemCapacity}) [white]from [#9999ff]${core} [white]@(${coreX}, ${coreY})\n`;
    doUnitApproachAndWait(coreX, coreY)
    print`Discarding ${Vars.unit.totalItems}\n`;
    printFlush()
    do {
        ensureDrop(core, Vars.unit.totalItems)
        // wait(2)
        unitControl.itemDrop(Blocks.air, Vars.unit.totalItems)
        // wait(2)
    } while (Vars.unit.totalItems)

    var timeout = Vars.time + 5000
    while (Vars.time < timeout && Vars.unit.totalItems == 0) {
        const itemsToTake = Math.min(unitItemCapacity, core[itemType])
        print`Taking [accent]${itemType} (x${itemsToTake}) [white]from [#9999ff]${core} [white]@(${coreX}, ${coreY})`; printFlush()
        if (itemsToTake == 0) break;
        unitControl.itemTake(core, itemType, itemsToTake)
        // wait(2)
    }
    return Vars.unit.totalItems != 0
}