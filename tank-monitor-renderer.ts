var __appName = "Liquid and Item Container Monitor"

// === configurations ===

const mem = new Memory(getBuilding("cell1"))
const s1 = new Memory(getBuilding("cell2"))
const s2 = new Memory(getBuilding("cell3"))
const s3 = new Memory(getBuilding("cell4"))
const s4 = new Memory(getBuilding("cell5"))


const enum MemoryFields {
    _,
    TIMESTAMP,
    DELTA,
    CONTAINERS_COUNT,
    TOTAL_LIQUIDS,
    TOTAL_LIQUID_CAPACITY,
    SUBSTANCE_TYPE,
    STRUCT_SIZE = 12,
    BASE = 8,
}

const FLAG_LIQUID = 1 << 29;
const FLAG_ITEM = 1 << 28;
const ID_MASK = 0xFFFF

const backendDeltaSmoothingSampleCount = 5;

// === utilities ===

function getFirst(type): AnyBuilding {
    for (var i = 0; i < Vars.links; i++) {
        const node = getLink(i);
        if (node.type == type) {
            return node;
        }
    }
    return undefined;
}

function constrainAbsolute(value, maxAbsolute) {
    if (value > maxAbsolute) {
        return maxAbsolute;
    }
    if (value < -maxAbsolute) {
        return -maxAbsolute;
    }
    return value;
}

function copyMem(srcPos, dstPos, dstInterval) {
    mem[dstPos + 0 * dstInterval] = s1[srcPos]
    mem[dstPos + 1 * dstInterval] = s2[srcPos]
    mem[dstPos + 2 * dstInterval] = s3[srcPos]
    mem[dstPos + 3 * dstInterval] = s4[srcPos]
    print`${s1[srcPos]} ${s2[srcPos]} ${s3[srcPos]} ${s4[srcPos]} `
}


// === life-cycle management and bootloader

var initialLinks = Vars.links;

var disp = getFirst(Blocks.logicDisplay) ?? getFirst(Blocks.largeLogicDisplay);

if (disp === undefined) {
    runBackend()
}

draw.clear(0, 180, 0)
drawFlush(disp)

const isLargeDisplay = disp.type == Blocks.largeLogicDisplay;
const D = isLargeDisplay ? 176 : 80; // display size

var msg = getFirst(Blocks.message)

// === globals ===

const barHeight = isLargeDisplay ? 12 : 5
const barSpacing = isLargeDisplay ? 10 : 5
const barHeightHalf = barHeight / 2;

var warningLevel = 0;

// === initialization

runInitialChecks()

while (Vars.links == initialLinks) {
    mainLoop()
}

// === functions ===

function mainLoop() {
    if (warningLevel != 0) {
        draw.clear(158, 52, 80);
    } else {
        draw.clear(90, 90, 90)
    }

    copyMem(MemoryFields.BASE + MemoryFields.DELTA, MemoryFields.BASE + MemoryFields.DELTA, MemoryFields.STRUCT_SIZE)
    copyMem(MemoryFields.BASE + MemoryFields.TOTAL_LIQUIDS, MemoryFields.BASE + MemoryFields.TOTAL_LIQUIDS, MemoryFields.STRUCT_SIZE)
    copyMem(MemoryFields.BASE + MemoryFields.TOTAL_LIQUID_CAPACITY, MemoryFields.BASE + MemoryFields.TOTAL_LIQUID_CAPACITY, MemoryFields.STRUCT_SIZE)
    copyMem(MemoryFields.BASE + MemoryFields.TIMESTAMP, MemoryFields.BASE + MemoryFields.TIMESTAMP, MemoryFields.STRUCT_SIZE)
    copyMem(MemoryFields.BASE + MemoryFields.SUBSTANCE_TYPE, MemoryFields.BASE + MemoryFields.SUBSTANCE_TYPE, MemoryFields.STRUCT_SIZE)
    printFlush()

    warningLevel = 0;

    drawStats(0)
    drawStats(1)
    drawStats(2)
    drawStats(3)

    drawWarning();

    drawFlush(disp)
}

function drawStats(i) {
    const y0 = (barHeight + barSpacing) * (4 - i)

    const baseAddr = MemoryFields.BASE + i * MemoryFields.STRUCT_SIZE

    if (Math.abs(mem[baseAddr + MemoryFields.TIMESTAMP] - Vars.time) > 3000) {
        draw.color(200, 200, 200)
        draw.stroke(3)
        draw.line({
            x: 5,
            y: y0,
            x2: 5 + barHeight,
            y2: y0 + barHeight,
        })
        drawIcon(i, undefined)
        return
    }

    const delta = mem[baseAddr + MemoryFields.DELTA]
    const liquids = mem[baseAddr + MemoryFields.TOTAL_LIQUIDS]
    const liquidCapacity = mem[baseAddr + MemoryFields.TOTAL_LIQUID_CAPACITY]
    const substanceType = mem[baseAddr + MemoryFields.SUBSTANCE_TYPE]

    const liquidRatio = liquids / liquidCapacity
    const barWidth = (liquidRatio) * D
    const barDeltaRatio = delta / liquidCapacity
    const barDeltaUnitWidth = barDeltaRatio * D
    const barDeltaWidth60s = constrainAbsolute(barDeltaUnitWidth * 60, D)
    const barDeltaWidth300s = constrainAbsolute(barDeltaUnitWidth * 300, D)

    const liquidDrainsIn = liquids / -Math.min(-1e-7, delta);

    print`liquids drains in ${liquidDrainsIn} (${liquids} / ${delta}\n\n`

    if (liquidDrainsIn < 60) {
        warningLevel = Math.max(warningLevel, 2);
    } else if (liquidDrainsIn < 300) {
        warningLevel = Math.max(warningLevel, 1);
    }

    if (liquidRatio < 0.5) {
        draw.color(200, 200, 30)
        warningLevel = Math.max(warningLevel, 1);
    } else {
        draw.color(69, 169, 230)
    }
    draw.rect({
        x: 0,
        y: y0,
        height: barHeight,
        width: barWidth
    })
    draw.color(100, 200, 220)
    draw.rect({
        x: barWidth,
        y: y0,
        height: barHeightHalf,
        width: barDeltaWidth300s,
    })
    draw.color(200, 230, 230)
    draw.rect({
        x: barWidth,
        y: y0,
        height: barHeightHalf,
        width: barDeltaWidth60s,
    })

    var image = undefined;
    if (substanceType) {
        if ((substanceType & FLAG_ITEM)) {
            image = lookup.item(substanceType & ID_MASK)
        } else if ((substanceType & FLAG_LIQUID)) {
            image = lookup.liquid(substanceType & ID_MASK)
        }
    }

    // if (image) {
        // draw.image({
        //     x: barHeightHalf + 3,
        //     y: y0 + barHeightHalf,
        //     image: image,
        //     size: barHeight + barSpacing / 2,
        //     rotation: 0
        // })
    // }
    print`[blue]drawIcon(${i}, ${image})\n[white]`
    drawIcon(i, image)

    if (liquidRatio < 0.1) {
        draw.color(240, 0, 0)
        draw.stroke(3)
        draw.line({
            x: D - 5 - barHeight,
            y: y0,
            x2: D - 5,
            y2: y0 + barHeight,
        })
    }
}

function runInitialChecks() {
    if (!checkMemoryState()) {
        drawMemoryError()
        haltUntilConfiguredLinksChange()
    }
}

function drawMemoryError() {
    const size = 30;
    draw.clear(90, 90, 90)
    draw.color(255, 255, 255)
    draw.image({
        x: D / 2,
        y: D / 2,
        size: size,
        rotation: 0,
        image: Blocks.memoryCell
    })

    const posBegin = D / 2 - size / 2 - 5
    const posEnd = D / 2 + size / 2 + 5

    draw.stroke(5)
    draw.color(200, 0, 0)
    draw.line({
        x: posBegin, y: posBegin, x2: posEnd, y2: posEnd
        // x: 0, y: 0, x2: 90, y2: 90
    })
    drawFlush(disp)
}

function haltUntilConfiguredLinksChange() {
    while (Vars.links == initialLinks);
    endScript()
}

function drawIcon(pos, image) {
    print`[red]image = ${image}[white]\n`
    var px = 10 + pos * 15
    var py = D - 17
    var sz = 15
    var halfSz = sz / 2
    if (image) {
        draw.color(255, 255, 255, 255)
        draw.image({
            x: px,
            y: py,
            image: image,
            size: sz,
            rotation: 0
        })
    } else {
        draw.color(140, 140, 140)
        draw.stroke(2)
        draw.lineRect({
            x: px - halfSz,
            y: py - halfSz,
            width: sz,
            height: sz
        })
    }
}

function drawWarning() {
    switch (warningLevel) {
        case 0:
            return;
        case 1:
            draw.color(255, 240, 0)
            break;
        case 2:
            draw.color(240, 30, 40)
            break;
    }
    draw.triangle({
        x: D - 25, y: D - 25,
        x2: D - 5, y2: D - 25,
        x3: D - 15, y3: D - 25 + 20 * 0.866
    })
}

function checkMemoryState() {
    var target = undefined;
    target = mem[0];
    // printFlush()
    // stopScript();
    return target !== undefined;
}

// === backend ===

function invalidSwitch(sw) {
    var target = undefined;
    target = sw.enabled;
    return target === undefined;
}

function runBackend() {
    const mem = new Memory(getBuilding("cell1"), 64)
    const beginSmoothingBufferSection = 32

    var deltaSmoothingBufferHead = 0
    var deltaSmoothingBufferLength = 0;
    var oldestSampleValue = 0
    var latestSampleValue = 0;
    var oldestSampleTimestamp = 0;
    var latestSampleTimestamp = 1e9;
    var previousSubstanceId = 0;

    var itemCategoryOfInterestSorter = getFirst(Blocks.sorter) ?? getFirst(Blocks.invertedSorter) ?? getFirst(Blocks.unloader);

    while (Vars.links == initialLinks) {
        main()
    }

    endScript()

    function pushDeltaSmoothingValue(value) {
        const headAddr = beginSmoothingBufferSection + deltaSmoothingBufferHead * 2
        const headAddr_1 = headAddr + 1
        if (deltaSmoothingBufferLength == backendDeltaSmoothingSampleCount) {
            oldestSampleValue = mem[headAddr]
            oldestSampleTimestamp = mem[headAddr_1]
            deltaSmoothingBufferLength -= 1;
        } else if (deltaSmoothingBufferLength == 0) {
            oldestSampleValue = value;
            oldestSampleTimestamp = Vars.time;
        }

        latestSampleValue = value;
        latestSampleTimestamp = Vars.time;
        mem[headAddr] = value
        mem[headAddr_1] = Vars.time
        deltaSmoothingBufferHead = (deltaSmoothingBufferHead + 1) % backendDeltaSmoothingSampleCount
        deltaSmoothingBufferLength += 1
    }

    function getSmoothedDeltaValue() {
        print`${latestSampleValue} ${deltaSmoothingBufferLength} ${oldestSampleTimestamp}\n`
        return (latestSampleValue - oldestSampleValue) / (latestSampleTimestamp - oldestSampleTimestamp) * 1000
    }

    function getLiquidIdFromLiquidContainer(liquidContainer) {
        var maxStorage = 0;
        var res = 0;
        for (var ti = 0; ti < Vars.liquidCount; ti++) {
            var curStorage = liquidContainer[lookup.liquid(ti)];
            if (curStorage > maxStorage) {
                maxStorage = curStorage;
                res = ti | FLAG_LIQUID;
            }
        }
        return res;
    }

    function getItemIdFromItemType(itemType) {
        for (var ti = 0; ti < Vars.itemCount; ti++) {
            if (lookup.item(ti) == itemType) {
                return ti | FLAG_ITEM;
            }
        }
        return 0;
    }


    function main() {
        var totalLiquids = 0
        var totalCapacity = 0
        var delta = 0
        var substanceType = 0;

        for (var i = 0; i < Vars.links; i++) {
            const building = getLink(i)
            if (building.type == Blocks.liquidContainer || building.type == Blocks.liquidTank) {
                totalLiquids += building.totalLiquids
                totalCapacity += building.liquidCapacity
                if (!substanceType) {
                    substanceType = getLiquidIdFromLiquidContainer(building);
                }
            } else if (building.type == Blocks.container || building.type == Blocks.vault) {
                if (itemCategoryOfInterestSorter?.config !== undefined) {
                    const itemConfig = itemCategoryOfInterestSorter.config
                    totalLiquids += building[itemConfig]
                    if (!substanceType) {
                        substanceType = getItemIdFromItemType(itemConfig);
                    }
                } else {
                    totalLiquids += building.totalItems
                    if (!substanceType && building.totalItems != 0) {
                        substanceType = getItemIdFromItemType(building.firstItem);
                    }
                }
                totalCapacity += building.itemCapacity
            }
        }

        // print`substanceType = raw: ${substanceType} (id: ${substanceType & ID_MASK}): ${lookup.liquid(substanceType & ID_MASK)} or ${lookup.item(substanceType & ID_MASK)}`
        // printFlush()

        if (substanceType) {
            previousSubstanceId = substanceType
        }

        // print("liquids:", previousTotalLiquids, "->", totalLiquids, ", in ", Vars.time - previousDataUpdatedAt, "\n")
        // print("delta=", totalLiquids - previousTotalLiquids)
        // printFlush()
        pushDeltaSmoothingValue(totalLiquids)
        delta = getSmoothedDeltaValue()
        print`(${Vars.time}) delta=${delta}\n`
        printFlush()

        const baseAddr = MemoryFields.BASE
        mem[baseAddr + MemoryFields.DELTA] = delta;
        mem[baseAddr + MemoryFields.TOTAL_LIQUIDS] = totalLiquids
        mem[baseAddr + MemoryFields.TOTAL_LIQUID_CAPACITY] = totalCapacity
        mem[baseAddr + MemoryFields.TIMESTAMP] = Vars.time
        mem[baseAddr + MemoryFields.SUBSTANCE_TYPE] = previousSubstanceId
    }
} 