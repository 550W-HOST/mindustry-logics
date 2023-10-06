// while (!Vars.links);

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

const numeralSegments = new MutableArray([0b0111111, 0b0000110, 0b1011011, 0b1001111, 0b1100110, 0b1101101, 0b1111101, 0b0000111, 0b1111111, 0b1101111, 0b1110111, 0b1111100, 0b0111001, 0b1011110, 0b1111001, 0b1110001])

function hueToGComponent(x) {
    // return Math.max(0, Math.min(1, Math.sin(2 * Math.PI * x - 0.5) + 0.5))
    return Math.max(0, Math.min(1, Math.sin(360 * x - 180 / Math.PI) + 0.5))

}

function fastSetHue(hue) {
    let [r, g, b] =
        [hueToGComponent(hue + 1 / 3) * 255,
        hueToGComponent(hue) * 255,
        hueToGComponent(hue - 1 / 3) * 255]
    draw.color(r, g, b)
    // stopScript()
}

function draw7Seg(x, y, width, segments) {
    var segments = segments;
    if (segments % 2 == 1) {
        draw.line({ x: x, y: y + 2 * width, x2: x + width, y2: y + 2 * width })
    }
    segments = Math.idiv(segments, 2)

    if (segments % 2 == 1) {
        draw.line({ x: x + width, y: y + width, x2: x + width, y2: y + 2 * width })
    }
    segments = Math.idiv(segments, 2)

    if (segments % 2 == 1) {
        draw.line({ x: x + width, y: y, x2: x + width, y2: y + width })
    }
    segments = Math.idiv(segments, 2)

    if (segments % 2 == 1) {
        draw.line({ x: x, y: y, x2: x + width, y2: y })
    }
    segments = Math.idiv(segments, 2)

    if (segments % 2 == 1) {
        draw.line({ x: x, y: y, x2: x, y2: y + width })
    }
    segments = Math.idiv(segments, 2)

    if (segments % 2 == 1) {
        draw.line({ x: x, y: y + width, x2: x, y2: y + 2 * width })
    }
    segments = Math.idiv(segments, 2)

    if (segments % 2 == 1) {
        draw.line({ x: x, y: y + width, x2: x + width, y2: y + width })
    }
    segments = Math.idiv(segments, 2)
}

let initialLinks = Vars.links;
let disp = getFirst(Blocks.logicDisplay) ?? getFirst(Blocks.largeLogicDisplay);
draw.clear(0, 180, 0);
drawFlush(disp);

let firstNode = getFirst(Blocks.powerNode) ?? getFirst(Blocks.powerNodeLarge);
let msg = getFirst(Blocks.message)

const isLargeDisplay = disp.type == Blocks.largeLogicDisplay;
const D = isLargeDisplay ? 176 : 80; // display size

const appStartTime = Vars.time % 1000000;
var maxScale = 1;
var maxObservedCapacity = 0;

var pcCtr = 0;

wait(1);

function drawPowerCapacityIndicator() {
    const currentPowerCapacity = firstNode.powerNetCapacity;
    maxObservedCapacity = Math.max(currentPowerCapacity, maxObservedCapacity)

    const hBase = 36;
    const height = isLargeDisplay ? 7 : 4;

    draw.color(255, 255, 255)
    draw.rect({ x: 0, y: hBase, width: D, height: height })

    draw.color(80, 80, 80)
    draw.rect({ x: 0, y: hBase + 1, width: D, height: height - 2 })
    draw.color(255, 255, 255)
    draw.rect({ x: 0, y: hBase + 1, width: (currentPowerCapacity / maxObservedCapacity) * D, height: height - 2 })
    
    // const hBase = 36;
    // const blockSize = isLargeDisplay ? 7 : 4;
    // let interval = isLargeDisplay ? 10 : 7;

    // draw.color(255, 255, 255)
    // draw.stroke(3)

    // let powerCapLog = Math.log10(firstNode.powerNetCapacity);
    // for (var i = 0; i < powerCapLog; i++) {
    //     draw.rect({ x: i * interval, y: hBase, height: blockSize, width: blockSize })
    // }

    // let powerCapMantissa = powerCapLog - Math.floor(powerCapLog);
    // if (powerCapMantissa > 0.875) { // log10 7.5 = 0.875
    //     draw.rect({ x: Math.floor(powerCapLog + 1) * interval, y: hBase, height: blockSize, width: blockSize })
    // } else if (powerCapMantissa > 0.4) { // log10 2.5 = 0.4
    //     let base = Math.floor(powerCapLog + 1) * interval;
    //     let h = blockSize;

    //     draw.triangle({ x: base, y: hBase, x2: base + 7, y2: hBase, x3: base, y3: hBase + h })
    // }

    if (Vars.ipt < 8) {
        // fastSetHue(firstNode.powerNetCapacity / 1e8)
        // draw.rect({ x: D - 35, y: D - 35, width: 23, height: 23 })
    } else {
        draw.color(255, 255, 255)
        draw.stroke(3)

        let powerCapLog = Math.log10(firstNode.powerNetCapacity);
        draw7Seg(D - 30, D - 30, 12, numeralSegments[Math.floor(powerCapLog)]);

        let powerCapMantissa = powerCapLog - Math.floor(powerCapLog);
        if (powerCapMantissa > 0.875) { // log10 7.5 = 0.875
            draw7Seg(D - 12, D - 30, 10, 0b1);
        } else if (powerCapMantissa > 0.4) { // log10 2.5 = 0.4
            draw7Seg(D - 12, D - 30, 10, 0b1000000);
        } else {
            draw7Seg(D - 12, D - 30, 10, 0b1000);
        }
    }
}

while (Vars.links == initialLinks) { // observe reconnections
    const pIn = firstNode.powerNetIn;
    const pOut = firstNode.powerNetOut;
    const pGainDelta = pIn - pOut;

    let maxFlow = Math.max(pIn, pOut);
    maxScale = Math.max(maxFlow, maxScale);
    // maxScale = maxFlow < 0.3 * maxScale ? 1.2 * maxFlow : maxScale;

    if (pIn <= pOut && (Math.floor(Vars.time / 700) % 2 == 0)) {
        draw.clear(158, 52, 80);
    } else {
        draw.clear(80, 80, 80);
    }

    drawPowerCapacityIndicator()

    draw.color(255, 255, 255);
    draw.image({ x: 20, y: D - 20, image: Blocks.powerNode, size: 30, rotation: 0 });

    draw.color(0, 255, 0)
    draw.rect({ x: 0, y: 24, height: 10, width: pIn / maxScale * D })
    draw.color(255, 0, 0)
    draw.rect({ x: 0, y: 12, height: 10, width: pOut / maxScale * D })

    draw.color(255, 255, 0)
    const drawPowerStorageWidth = firstNode.powerNetStored / firstNode.powerNetCapacity * D;
    draw.rect({ x: 0, y: 0, height: 10, width: drawPowerStorageWidth })

    if (pGainDelta > 0)
        draw.color(0, 160, 0);
    else
        draw.color(255, 130, 40);

    const powerGainRatioDisplaySizePerUnit = pGainDelta / firstNode.powerNetCapacity * D
    // *** Mindustry intrinsic feature: Drawing dimensions are modulo 512
    draw.rect({
        x: Math.max(drawPowerStorageWidth, 0),
        y: 3,
        height: 7,
        width: constrainAbsolute(powerGainRatioDisplaySizePerUnit * 60, D)
    })
    draw.rect({
        x: Math.max(drawPowerStorageWidth, 0),
        y: 0,
        height: 3,
        width: constrainAbsolute(powerGainRatioDisplaySizePerUnit * 300, D)
    })

    drawFlush(disp);

    print`${pcCtr++}\n`
    print`powernetout = ${Math.floor(firstNode.powerNetOut)}\n`
    print`powernetin = ${Math.floor(firstNode.powerNetIn)}\n`
    print`powernetcap = ${Math.floor(firstNode.powerNetCapacity)}\n`
    print`powernetstored = ${Math.floor(firstNode.powerNetStored)}\n`
    print`powerGainDisplaySizePUnit = ${powerGainRatioDisplaySizePerUnit * 300}`
    printFlush(getBuilding("message1"))

    // if (Vars.time - appStartTime > 20) {
    //     endScript();
    // }
}
