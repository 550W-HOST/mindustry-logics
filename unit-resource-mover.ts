// experimental

var unitFlag = 130000 + Math.rand(999)

const config = {
    waypoints: new MutableArray([
        314, 141
    ]),
    itemTypes: new MutableArray([
        Items.phaseFabric,
        Items.silicon
    ])
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
    wait(3)

    init()

    while (true) {
        for (var itemIndex = 0; itemIndex < config.itemTypes.size; itemIndex++) {
            const item = unchecked(config.itemTypes[itemIndex])
            fetchItemFromCore(item)

            const itemsFetched = Vars.unit.totalItems;
            if (itemsFetched == 0) continue;

            var itemsPerWaypoint = itemsFetched / (config.waypoints.size / 2);
            for (var waypointIndex = 0; waypointIndex < config.waypoints.size; waypointIndex += 2) {
                var currentItems = Vars.unit.totalItems;
                if (currentItems == 0) break;

                // leaves the second argument checked to prevent odd numbers of elements
                var wpX = unchecked(config.waypoints[waypointIndex])
                var wpY = config.waypoints[waypointIndex + 1]

                var itemsToDrop = currentItems - (itemsFetched - Math.floor(itemsPerWaypoint * (waypointIndex / 2 + 1) + 0.5))

                print`Approaching waypoint[${waypointIndex / 2}] @(${wpX}, ${wpY}) with ${item} x${Vars.unit.totalItems}. Drop ${itemsToDrop} at max\n`;
                print`${currentItems} - (${itemsFetched} - ${Math.floor(itemsPerWaypoint * (waypointIndex / 2 + 1) + 0.5)})`
                printFlush()
                doUnitApproachAndWait(wpX, wpY)
                var [, building,] = unitControl.getBlock(wpX, wpY)

                itemsToDrop = Math.min(building.itemCapacity - building[item], itemsToDrop)
                print`Item to drop capped at ${itemsToDrop}\n`; printFlush()
                // wait(1)
                unitControl.itemDrop(building, itemsToDrop)
                // wait(1)

                if (Vars.unit.health < 0.5 * Vars.unit.maxHealth) {
                    selfHeal()
                }
            }
        }
    }
}

function selfHeal() {
    var [found, x, y,] = unitLocate.building(
        {
            group: "repair",
            enemy: false
        }
    )

    if (!found) return;

    doUnitApproachAndWait(x, y);
    var timeout = Vars.time + 10000;
    while (Vars.unit.health < 0.9 * Vars.unit.maxHealth && Vars.time < timeout);
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

    ttl = 64;
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

        if (tryBind && (ttl-- == 0 || Vars.unit == first)) {
            break;
        }
    }
    print`Unable to bind to ${unitType}`
    printFlush()
    return undefined;
}

function reportBindFailure() {
    print`Failed to bind to a unit`
    printFlush()
    endScript()
}

function doUnitApproachAndWait(x, y) {
    print`En route to (${x}, ${y})\n`;
    do {
        // unitControl.approach({ x: x, y: y, radius: 3 })
        unitControl.move(x, y)
        wait(0.5)
        // wait(3)
    } while (!unitControl.within({ x: x, y: y, radius: 3 }));
    print`En route to (${x}, ${y}) - waiting`; printFlush()
    waitUntilStop()
    // wait(3)
}

function fetchItemFromCore(itemType) {
    print`On way of ${itemType} (x${unitItemCapacity}) from ${core} @(${coreX}, ${coreY})\n`;
    doUnitApproachAndWait(coreX, coreY)
    print`Discarding ${Vars.unit.totalItems}\n`;
    do {
        unitControl.itemDrop(core, Vars.unit.totalItems)
        // wait(2)
        unitControl.itemDrop(Blocks.air, Vars.unit.totalItems)
        // wait(2)
    } while (Vars.unit.totalItems)

    do {
        const itemsToTake = Math.min(unitItemCapacity, core[itemType])
        print`Taking ${itemType} (x${itemsToTake}) from ${core} @(${coreX}, ${coreY})`; printFlush()
        if (itemsToTake == 0) break;
        unitControl.itemTake(core, itemType, itemsToTake)
        // wait(2)
    } while (Vars.unit.totalItems == 0)
}