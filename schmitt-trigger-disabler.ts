asm`set START_THRESHOLD 0.5`
asm`set STOP_THRESHOLD 0.1`

function isNode(typ) {
    if (typ == Blocks.powerNode) {
        return true
    }
    if (typ == Blocks.powerNodeLarge) {
        return true
    }
    if (typ == Blocks.beamNode) {
        return true
    }
    return false
}

function getFirstNode(): AnyBuilding {
    for (var i = 0; i < Vars.links; i++) {
        const lnk = getLink(i)
        const typ = lnk.type
        if (isNode(typ)) {
            return lnk
        }
    }
}

let links = Vars.links
const node = getFirstNode()

while (links == Vars.links) {
    printFlush()

    const stored = node.powerNetStored
    const netCap = node.powerNetCapacity

    const stopThres = netCap * getVar<number>("STOP_THRESHOLD")
    const startThres = netCap * getVar<number>("START_THRESHOLD")

    print`[white]Current config: \n- [red]Stops [white]when <= ${getVar("STOP_THRESHOLD")}\n- [green]Activates [white]when >= ${getVar("START_THRESHOLD")}`
    print`\nCurrent: ${Math.floor(stored / netCap * 1000) / 1000}`

    var enable: boolean
    if (stored >= startThres) {
        print`\n ==> [green]Activated`
        enable = true
    } else if (stored <= stopThres) {
        print`\n ==> [red]Stopped`
        enable = false
    } else {
        print`\n ==> [cyan]Idle`
        continue
    }

    for (var i = 0; i < Vars.links; i++) {
        const lnk = getLink(i)
        control.enabled(lnk, enable)
    }
}