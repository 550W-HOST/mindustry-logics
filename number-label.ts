var numA = 8;
var numB1 = 0;
var numB2 = 8;

var colorR = 0;
var colorG = 0; 
var colorB = 255;

const numeralSegments = new MutableArray([
    0b0111111,
    0b0000110,
    0b1011011,
    0b1001111,
    0b1100110,
    0b1101101,
    0b1111101,
    0b0000111,
    0b1111111,
    0b1101111,

    0b1110111,
    0b1111100,
    0b0111001,
    0b1011110,
    0b1111001,
    0b1110001
])

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

const w = 13;
const dashWidth = 0.5 * w;
const spacing = 0.6 * w;
const y = 80 / 2 - w;

main()

function main() {
    draw.clear(255, 255, 255)
    draw.color(colorR, colorG, colorB)
    draw.stroke(5)
    if (numA !== undefined) {
        draw7Seg(spacing, y, w, numeralSegments[numA])
        draw7Seg(spacing * 2 + w, 80 / 2 - dashWidth, dashWidth, 0b1000000)
    }
    // if (numB === undefined) {
    //     numB = 0;
    // }
    if (numB1 != 0) {
        draw7Seg(spacing * 3 + dashWidth + w, y, w, numeralSegments[numB1])
    }
    draw7Seg(spacing * 4 + dashWidth + w * 2, y, w, numeralSegments[numB2])
    drawFlush(getFirst(Blocks.logicDisplay) ?? getFirst(Blocks.largeLogicDisplay))
}

function getFirst(type): AnyBuilding {
    for (var i = 0; i < Vars.links; i++) {
        const node = getLink(i);
        if (node.type == type) {
            return node;
        }
    }
    return undefined;
}