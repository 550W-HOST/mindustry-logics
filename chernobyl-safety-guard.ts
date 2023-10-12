var autoStopWhenStorageFull = false;

const cryofluidConsumptionRate = 2.4; // 2.4 unit per second

var safeThreshold = 29;

var loopBegin = Vars.time;

while (true) {
    var isStorageNotFull = autoStopWhenStorageFull ? undefined : true; // execution time: <= 33ms, 0.08 cryofluid

    for (let i = 0; i < Vars.links; i++) {
        const block = getLink(i);
        if (block.type == Blocks.thoriumReactor) {
            const shouldStart = block[Liquids.cryofluid] > Math.max(safeThreshold * block.timescale, 1) && block.heat <= 0;
            if (isStorageNotFull === undefined) {
                // print`${block.powerNetStored} < ${block.powerNetCapacity} or ${block.powerNetCapacity} > ${block.powerNetOut}\n`
                isStorageNotFull = block.powerNetStored < block.powerNetCapacity
                    || block.powerNetCapacity < block.powerNetOut;
            } // 17ms + 66ms
            control.enabled(block, shouldStart && isStorageNotFull);
        }
    }

    var timeUsage = Vars.time - loopBegin;
    loopBegin = Vars.time;

    safeThreshold = timeUsage / (1000 / cryofluidConsumptionRate); // timeUsage / 1000 * cryofluidConsumptionRate
    print`timeUsage = ${timeUsage}`
    print`\nsafeThreshold = ${safeThreshold}`
    printFlush()
}