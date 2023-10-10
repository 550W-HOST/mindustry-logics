const cryofluidConsumptionRate = 2.4; // 2.4 unit per second

var safeThreshold = 29;

var loopBegin = Vars.time;

while (true) {
    for (let i = 0; i < Vars.links; i++) {
        const block = getLink(i);
        if (block.type == Blocks.thoriumReactor) {
            const isSafe = block[Liquids.cryofluid] > Math.max(safeThreshold * block.timescale, 1) && block.heat <= 0;
            control.enabled(block, isSafe);
        }
    }

    var timeUsage = Vars.time - loopBegin;
    loopBegin = Vars.time;

    safeThreshold = timeUsage / (1000 / cryofluidConsumptionRate); // timeUsage / 1000 * cryofluidConsumptionRate
    print`timeUsage = ${timeUsage}`
    print`\nsafeThreshold = ${safeThreshold}`
    printFlush()
}