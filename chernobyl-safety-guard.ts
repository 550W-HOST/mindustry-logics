const colorRed = [255, 0, 0]
const colorGreen = [0, 255, 0]

const displays = new DynamicArray<BasicBuilding>(3);

var lastFlushed = undefined;
var displayCount = 0;

function loadDisplays() {
    for (let i = 0; i < Vars.links && displays.length < displays.size; i++) {
        const block = getLink(i);
        if (block.type == Blocks.largeLogicDisplay || block.type == Blocks.logicDisplay) {
            displays.push(block);
            draw.clear(0, 0, 0);
            drawFlush(block);
        }
    }
    displayCount = displays.length;
}

function clearAllDisplays([cr, cg, cb]: number[]) { // : number[] supresses warnings
    for (let i = 0; i < displays.length; i++) {
        const block = displays[i];
        draw.clear(cr, cg, cb);
        drawFlush(block);
        lastFlushed = block;
    }
}

loadDisplays();

while (true) {
    var anyUnsafe = false;
    for (let i = 0; i < Vars.links; i++) {
        const block = getLink(i);
        if (block.type == Blocks.thoriumReactor) {
            const isSafe = block[Liquids.cryofluid] > 1;
            control.enabled(block, isSafe);
            if (!isSafe) {
                anyUnsafe = true;
            }
        }
    }

    if (anyUnsafe) {
        clearAllDisplays(colorRed);
    } else {
        clearAllDisplays(colorGreen);
    }
}