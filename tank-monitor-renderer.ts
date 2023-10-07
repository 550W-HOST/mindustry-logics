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
    STRUCT_SIZE = 12,
    BASE = 8,
}

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

// === initialization

runInitialChecks()

while (Vars.links == initialLinks) {
    mainLoop()
}

// === functions ===

function mainLoop() {
    draw.clear(90, 90, 90)
    drawIcon()

    copyMem(MemoryFields.BASE + MemoryFields.DELTA, MemoryFields.BASE + MemoryFields.DELTA, MemoryFields.STRUCT_SIZE)
    copyMem(MemoryFields.BASE + MemoryFields.TOTAL_LIQUIDS, MemoryFields.BASE + MemoryFields.TOTAL_LIQUIDS, MemoryFields.STRUCT_SIZE)
    copyMem(MemoryFields.BASE + MemoryFields.TOTAL_LIQUID_CAPACITY, MemoryFields.BASE + MemoryFields.TOTAL_LIQUID_CAPACITY, MemoryFields.STRUCT_SIZE)
    copyMem(MemoryFields.BASE + MemoryFields.TIMESTAMP, MemoryFields.BASE + MemoryFields.TIMESTAMP, MemoryFields.STRUCT_SIZE)
    printFlush()
    drawStats(0)
    drawStats(1)
    drawStats(2)
    drawStats(3)

    drawFlush(disp)
}

function drawStats(i) {
    const y0 = (barHeight + barSpacing) * (4 - i)

    const baseAddr = MemoryFields.BASE + i * MemoryFields.STRUCT_SIZE

    if (Math.abs(mem[baseAddr + MemoryFields.TIMESTAMP] - Vars.time) > 3000) {
        draw.color(200, 0, 0)
        draw.stroke(3)
        draw.line({
            x: 5,
            y: y0,
            x2: 5 + barHeight,
            y2: y0 + barHeight,
        })
        return
    }

    const delta = mem[baseAddr + MemoryFields.DELTA]
    const liquids = mem[baseAddr + MemoryFields.TOTAL_LIQUIDS]
    const liquidCapacity = mem[baseAddr + MemoryFields.TOTAL_LIQUID_CAPACITY]

    const liquidRatio = liquids / liquidCapacity
    const barWidth = (liquidRatio) * D
    const barDeltaUnitWidth = (delta / liquidCapacity) * D
    const barDeltaWidth60s = Math.min(D, barDeltaUnitWidth * 60)
    const barDeltaWidth300s = Math.min(D, barDeltaUnitWidth * 300)

    if (liquidRatio < 0.5) {
        draw.color(200, 200, 30)
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

function drawIcon() {
    draw.color(255, 255, 255, 255)
    draw.image({
        x: 17,
        y: D - 17,
        image: Liquids.water,
        size: 15,
        rotation: 0
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
        }

        latestSampleValue = value;
        mem[headAddr] = value
        mem[headAddr_1] = Vars.time
        deltaSmoothingBufferHead = (deltaSmoothingBufferHead + 1) % backendDeltaSmoothingSampleCount
        deltaSmoothingBufferLength += 1
    }

    function getSmoothedDeltaValue() {
        print`${latestSampleValue} ${deltaSmoothingBufferLength} ${oldestSampleTimestamp}`
        return (latestSampleValue - oldestSampleValue) / (Vars.time - oldestSampleTimestamp) * 1000
    }


    function main() {
        var totalLiquids = 0
        var totalCapacity = 0
        var delta = 0
        for (var i = 0; i < Vars.links; i++) {
            const building = getLink(i)
            if (building.type == Blocks.liquidContainer || building.type == Blocks.liquidTank) {
                totalLiquids += building.totalLiquids
                totalCapacity += building.liquidCapacity
            }
        }

        // print("liquids:", previousTotalLiquids, "->", totalLiquids, ", in ", Vars.time - previousDataUpdatedAt, "\n")
        // print("delta=", totalLiquids - previousTotalLiquids)
        // printFlush()
        pushDeltaSmoothingValue(totalLiquids)
        delta = getSmoothedDeltaValue()
        print`(${Vars.time}) delta=${delta}`
        printFlush()

        const baseAddr = MemoryFields.BASE
        mem[baseAddr + MemoryFields.DELTA] = delta;
        mem[baseAddr + MemoryFields.TOTAL_LIQUIDS] = totalLiquids
        mem[baseAddr + MemoryFields.TOTAL_LIQUID_CAPACITY] = totalCapacity
        mem[baseAddr + MemoryFields.TIMESTAMP] = Vars.time
    }
}