var __appName = "Power Grapher"

asm `set MAX_FPS 999`

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

let initialLinks = Vars.links;
let disp: AnyBuilding = getFirst(Blocks.logicDisplay) ?? getFirst(Blocks.largeLogicDisplay) ?? getFirst(getVar("@tile-logic-display"));
draw.clear(0, 180, 0);
drawFlush(disp);

let firstNode = getFirst(Blocks.powerNode) ?? getFirst(Blocks.powerNodeLarge);
let msg = getFirst(Blocks.message)


// const isLargeDisplay = disp.type == Blocks.largeLogicDisplay;
// const D = isLargeDisplay ? 176 : 80; // display size
const Dx: number = sensor(getVar("@displayWidth"), disp)
const Dy: number = sensor(getVar("@displayHeight"), disp)

const strokeWidth = Math.max(1, Math.idiv(Dy, 80))

const dispW = Math.min(512, Dx)

const displayScaleMultipleFactor = 2
var ioDisplayScale = 1
var storageDisplayScale = 1

var currentScreenTick = 1

draw.clear(80, 80, 80)
drawFlush()

var prevPInY = undefined
var prevPOutY = undefined
var prevNetStored = undefined
var prevNetCap = undefined

function redrawAtIndex(tick, pIn, pOut, pNetCap, pNetStored) {
    const prevTick = tick - 1

    // const pInY = Math.idiv(pIn * Dy, ioDisplayScale)
    // const pOutY = Math.idiv(pOut * Dy, ioDisplayScale)
    // const pNetCapY = Math.idiv(pNetCap * Dy, storageDisplayScale)
    draw.color(80, 80, 80)
    draw.rect({ x: prevTick, y: 0, height: Dy, width: 7 })

    draw.stroke(1)

    draw.color(180, 180, 180)
    draw.line({ x: tick + 1, y: 0, x2: tick + 1, y2: Dy })

    if (pIn < pOut) {
        draw.color(255, 165, 0, 64) // orange
        draw.rect({ x: prevTick, y: 0, height: Dy, width: 1 })
    }

    draw.stroke(strokeWidth)

    draw.color(180, 180, 255)
    draw.line({ x: prevTick, y: prevNetCap, x2: tick, y2: pNetCap })

    draw.color(255, 255, 100)
    draw.line({ x: prevTick, y: prevNetStored, x2: tick, y2: pNetStored })

    draw.color(100, 255, 100)
    draw.line({ x: prevTick, y: prevPInY, x2: tick, y2: pIn })

    draw.color(255, 100, 100)
    draw.line({ x: prevTick, y: prevPOutY, x2: tick, y2: pOut })

    prevPInY = pIn
    prevPOutY = pOut
    prevNetCap = pNetCap
    prevNetStored = pNetStored

}

// function composeValue(pIn, pOut, pNetCap) {
//     return pNetCap * 256 * 256 + pOut * 256 + pIn
// }

// function rescaleData(newIODisplayScale, newStorageDisplayScale) {
//     print`Rescaling data`
//     printFlush()
//     for (var i = 1; i < dispW; i++) {
//         print`Rescaling data i = ${i}`
//         printFlush()
//         const cData = mem[i]
//         const pIn = cData % 256
//         const pOut = cData / 256 % 256
//         const pNetCap = cData / 256 / 256 % 256

//         const nIn = pIn * ioDisplayScale / newIODisplayScale
//         const nOut = pOut * ioDisplayScale / newIODisplayScale
//         const nStore = pNetCap * storageDisplayScale / newStorageDisplayScale
//         mem[i] = composeValue(nIn, nOut, nStore)
//     }
// }

function showInvalidationMask() {
    draw.color(80, 80, 80, 180)
    draw.rect({ x: 0, y: 0, height: Dy, width: Dx })
}

while (Vars.links == initialLinks) {
    const timeBegin = Vars.time

    const pIn = firstNode.powerNetIn;
    const pOut = firstNode.powerNetOut;
    const pNetCap = firstNode.powerNetCapacity
    const stored = firstNode.powerNetStored

    const maxFlow = Math.max(pIn, pOut)

    // if (!isFirstRun && (maxFlow > ioDisplayScale || pNetCap > storageDisplayScale)) {
    //     rescaleData(ioDisplayScale, newStorageDisplayScale)
    //     ioDisplayScale = newIODisplayScale
    //     storageDisplayScale = newStorageDisplayScale

    //     for (var i = 1; i < dispW; i++) {
    //         redrawAtIndex(i)
    //         print`Redrawing at index ${i}`
    //         printFlush()
    //     }
    // }
    // ioDisplayScale = newIODisplayScale
    // storageDisplayScale = newStorageDisplayScale

    var didInvalidate = false
    if (maxFlow > ioDisplayScale) {
        let newScale = Math.max(ioDisplayScale, maxFlow * displayScaleMultipleFactor)
        prevPInY = prevPInY / newScale * ioDisplayScale
        prevPOutY = prevPOutY / newScale * ioDisplayScale

        didInvalidate = true
        ioDisplayScale = newScale
    }

    if (pNetCap > storageDisplayScale) {
        let newScale = Math.max(storageDisplayScale, pNetCap * 1.618)
        prevNetCap = prevNetCap / newScale * storageDisplayScale
        prevNetStored = prevNetStored / newScale * storageDisplayScale

        didInvalidate = true
        storageDisplayScale = newScale
    }

    if (didInvalidate) {
        showInvalidationMask()
    }

    redrawAtIndex(
        currentScreenTick,
        pIn / ioDisplayScale * Dy,
        pOut / ioDisplayScale * Dy,
        pNetCap / storageDisplayScale * Dy,
        stored / storageDisplayScale * Dy,
    )
    currentScreenTick++
    if (currentScreenTick >= dispW) {
        showInvalidationMask()
        currentScreenTick = 1
    }

    drawFlush(disp)

    const extraDelay = Math.max(0, 1000 / getVar<number>("MAX_FPS") - (Vars.time - timeBegin))
    wait(extraDelay / 1000)
}