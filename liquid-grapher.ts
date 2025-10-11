asm`set <Liquid Monitor>`
asm`set <Ver 25.10.a>`

asm`set MAX_FPS 999`

// while (!Vars.links);

const tankArray = new MutableArray<AnyBuilding>([undefined, undefined, undefined, undefined])
var tankCount = 0

function getFirst(type): AnyBuilding {
    for (var i = 0; i < Vars.links; i++) {
        const node = getLink(i);
        if (node.type == type) {
            return node;
        }
    }
    return undefined;
}

function initializeTanks() {
    for (var i = 0; i < Vars.links; i++) {
        const node = getLink(i)
        if (node.type == Blocks.liquidContainer || node.type == Blocks.liquidTank) {
            tankArray[tankCount++] = node
        }
    }

    if (tankCount > tankArray.size) {
        endScript()
    }
}

let initialLinks = Vars.links;
let disp: AnyBuilding = getFirst(Blocks.logicDisplay) ?? getFirst(Blocks.largeLogicDisplay) ?? getFirst(getVar("@tile-logic-display"));
draw.clear(0, 180, 0);
drawFlush(disp);

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

var nextLoopBeginTime = 0

initializeTanks()

const tankCountInstructionSkipCount = tankArray.size - tankCount

// begin: drawing

function showInvalidationMask() {
    draw.color(80, 80, 80, 180)
    draw.rect({ x: 0, y: 0, height: Dy, width: Dx })
}

var prev1 = undefined
var prev2 = undefined
var prev3 = undefined
var prev4 = undefined

const warnLevelThreshold = Dy * 0.001
const criticalThreshold = Dy * 0.1

function redrawAtIndex(tick, r1, r2, r3, r4) {
    const prevTick = tick - 1

    draw.color(80, 80, 80)
    draw.rect({ x: prevTick, y: 0, height: Dy, width: 7 })

    draw.stroke(1)

    draw.color(180, 180, 180)
    draw.line({ x: tick + 1, y: 0, x2: tick + 1, y2: Dy })

    var warnLevel = Math.max(
        0,
        Math.max(Math.max(prev1 - r1, prev2 - r2), Math.max(prev3 - r3, prev4 - r4))
    )

    drawCritical: {
        drawWarn: {
            asm`op add @counter @counter ${tankCountInstructionSkipCount}`

            if (r4 < criticalThreshold) {
                break drawWarn // i.e. draw red backgrounds immediately
            }

            if (r3 < criticalThreshold) {
                break drawWarn
            }

            if (r2 < criticalThreshold) {
                break drawWarn
            }

            if (r1 < criticalThreshold) {
                break drawWarn
            }

            if (warnLevel > warnLevelThreshold) {
                draw.color(255, 165, 0, 80) // orange
                draw.rect({ x: prevTick, y: 0, height: Dy, width: 1 })
            }

            break drawCritical
        }

        draw.color(255, 0, 0, 100) // red
        draw.rect({ x: prevTick, y: 0, height: Dy, width: 1 })
    }

    draw.stroke(strokeWidth)

    draw.color(115, 251, 211)
    draw.line({ x: prevTick, y: prev1, x2: tick, y2: r1 })

    draw.color(79, 220, 243)
    draw.line({ x: prevTick, y: prev2, x2: tick, y2: r2 })

    draw.color(74, 143, 231)
    draw.line({ x: prevTick, y: prev3, x2: tick, y2: r3 })

    draw.color(92, 122, 255)
    draw.line({ x: prevTick, y: prev4, x2: tick, y2: r4 })

    prev1 = r1
    prev2 = r2
    prev3 = r3
    prev4 = r4
}

// end: drawing

const tank1Cap = unchecked(tankArray[0]).liquidCapacity
const tank2Cap = unchecked(tankArray[1]).liquidCapacity
const tank3Cap = unchecked(tankArray[2]).liquidCapacity
const tank4Cap = unchecked(tankArray[3]).liquidCapacity

const tank1PixelPerLiquid = tank1Cap === undefined ? undefined : Dy / tank1Cap
const tank2PixelPerLiquid = tank2Cap === undefined ? undefined : Dy / tank2Cap
const tank3PixelPerLiquid = tank3Cap === undefined ? undefined : Dy / tank3Cap
const tank4PixelPerLiquid = tank4Cap === undefined ? undefined : Dy / tank4Cap

while (Vars.links == initialLinks) {
    var v1 = unchecked(tankArray[0]).totalLiquids
    var v2 = unchecked(tankArray[1]).totalLiquids
    var v3 = unchecked(tankArray[2]).totalLiquids
    var v4 = unchecked(tankArray[3]).totalLiquids

    var repCount = 1

    // begin: fps limiter + smoothing
    if (Vars.time < nextLoopBeginTime) {
        do {
            v1 += unchecked(tankArray[0]).totalLiquids
            v2 += unchecked(tankArray[1]).totalLiquids
            v3 += unchecked(tankArray[2]).totalLiquids
            v4 += unchecked(tankArray[3]).totalLiquids

            repCount++
        } while (Vars.time < nextLoopBeginTime);

        v1 /= repCount
        v2 /= repCount
        v3 /= repCount
        v4 /= repCount
    }

    nextLoopBeginTime = Vars.time + 1000 / getVar<number>("MAX_FPS")

    // end: fps limiter + smoothing

    var didInvalidate = false

    if (didInvalidate) {
        showInvalidationMask()
    }

    redrawAtIndex(
        currentScreenTick,
        v1 * tank1PixelPerLiquid,
        v2 * tank2PixelPerLiquid,
        v3 * tank3PixelPerLiquid,
        v4 * tank4PixelPerLiquid,
    )
    currentScreenTick++
    if (currentScreenTick >= dispW) {
        showInvalidationMask()
        currentScreenTick = 1
    }

    drawFlush(disp)
}

