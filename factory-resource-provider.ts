var initialLinks = Vars.links;

print('[gray]--')
printFlush()

const dataArray = new MutableArray([
    Blocks.groundFactory,
    Units.dagger, Items.lead, 10, Items.silicon, 10, undefined,
    Units.nova, Items.lead, 20, Items.silicon, 30, Items.titanium, 20, undefined,
    Units.crawler, Items.coal, 10, Items.silicon, 8, undefined,
    undefined,
    Blocks.airFactory,
    Units.flare, Items.silicon, 15, undefined,
    Units.mono, Items.lead, 15, Items.silicon, 30, undefined,
    undefined,
    Blocks.navalFactory,
    Units.risso, Items.silicon, 20, Items.metaglass, 35, undefined,
    Units.retusa, Items.silicon, 15, Items.metaglass, 25, Items.titanium, 20, undefined,
    undefined,
    Blocks.additiveReconstructor, Items.silicon, 40, Items.graphite, 40, undefined,
    Blocks.multiplicativeReconstructor, Items.silicon, 130, Items.titanium, 80, Items.metaglass, 40, undefined,
    Blocks.exponentialReconstructor, Items.silicon, 850, Items.titanium, 750, Items.plastanium, 650, undefined,
    Blocks.tetrativeReconstructor, Items.silicon, 1000, Items.plastanium, 600, Items.surgeAlloy, 500, Items.phaseFabric, 350, undefined
]) // 78 instructions

const factoryOffsetQuickLookupTable = new MutableArray([
    Blocks.groundFactory, 0,
    Blocks.airFactory, 22,
    Blocks.navalFactory, 34,
    Blocks.additiveReconstructor, 50,
    Blocks.multiplicativeReconstructor, 56,
    Blocks.exponentialReconstructor, 64,
    Blocks.tetrativeReconstructor, 72
])

var unloader = undefined;
var container = undefined;

while (checkState()) {
    init();
    while (checkState()) {
        main()
    }
}

function isFactory(v) {
    return v == Blocks.groundFactory || v == Blocks.airFactory || v == Blocks.navalFactory ||
        v == Blocks.additiveReconstructor ||
        v == Blocks.multiplicativeReconstructor ||
        v == Blocks.exponentialReconstructor ||
        v == Blocks.tetrativeReconstructor
}

function isElementaryFactory(v) {
    return v == Blocks.groundFactory || v == Blocks.airFactory || v == Blocks.navalFactory
}

function getFactoryDataOffset(v): number {
    for (var i = 0; i < factoryOffsetQuickLookupTable.size; i += 2) {
        if (unchecked(factoryOffsetQuickLookupTable[i]) == v) {
            return unchecked(factoryOffsetQuickLookupTable[i + 1]) as number
        }
    }
    return -1;
}

function handleSpecifiedFactory(blk, arrayOffset) {
    print`Handling specified factory ${blk} (offset = ${arrayOffset})`
    printFlush()
    // wait(1)
    for (; dataArray[arrayOffset] !== undefined; arrayOffset += 2) {
        const itemType = dataArray[arrayOffset] as symbol
        const itemCount = dataArray[arrayOffset + 1] as number
        print`(index ${arrayOffset}) Block ${blk} has ${blk[itemType]}x ${itemType}. ${itemCount} is required at minimum. `
        printFlush()
        // wait(0.5)
        if (blk[itemType] < itemCount) {
            var timeout = Vars.time + 1000
            while (Vars.time < timeout) {
                checkState()
                if (container !== undefined) {
                    if (container[itemType] == 0) {
                        print`[accent]Container [cyan]${container}[] has no ${itemType}. Skipping`
                        printFlush()
                        wait(0.05)
                        break;
                    }
                }
                setUnloaders(itemType)
                print`[green]Set unloader [white]${unloader} []to [green]${itemType}[]. [white]${blk}[${itemType}] = [pink]${blk[itemType]}`
                printFlush()
            }
        }
    }
}

function setUnloaders(itemType) {
    // control.config(unloader, itemType)
    control.config(getVar("__unloader1"), itemType)
    control.config(getVar("__unloader2"), itemType)
    control.config(getVar("__unloader3"), itemType)
    control.config(getVar("__unloader4"), itemType)
    control.config(getVar("__unloader5"), itemType)
    control.config(getVar("__unloader6"), itemType)
}

function loadUnloaders() {
    // This is approximately the same performance compared to using unchecked DynamicArray
    // This hand-crafted version uses more instructions during initialization
    // and 1 less instruction each push

    var uldr = undefined;
    var _suppressStaticCheck = true;
    setter: {
        // asm`set __unloader_setter null`

        // asm`set __unloader_loader_set_return @counter`

        asm`set __unloader1 null`
        asm`set __unloader2 null`
        asm`set __unloader3 null`
        asm`set __unloader4 null`
        asm`set __unloader5 null`
        asm`set __unloader6 null`

        // note that @counter represents the NEXT line the processor will read code from

        asm`op add __unloader_loader_set_begin @counter 1`

        if (_suppressStaticCheck) break setter;

        asm`set __unloader1 ${uldr}`
        asm`set @counter __unloader_loader_set_return`
        asm`set __unloader2 ${uldr}`
        asm`set @counter __unloader_loader_set_return`
        asm`set __unloader3 ${uldr}`
        asm`set @counter __unloader_loader_set_return`
        asm`set __unloader4 ${uldr}`
        asm`set @counter __unloader_loader_set_return`
        asm`set __unloader5 ${uldr}`
        asm`set @counter __unloader_loader_set_return`
        asm`set __unloader6 ${uldr}`
        asm`set @counter __unloader_loader_set_return`
    }

    var unloaderCnt = 0
    for (var i = 0; i < Vars.links && unloaderCnt < 6; i++) {
        uldr = getLink(i)
        if (uldr.type == Blocks.unloader) {
            asm`op add __unloader_loader_set_return @counter 2` 
            asm`op mul __unloader_loader_instruction_offset 2 ${unloaderCnt}`
            asm`op add @counter __unloader_loader_set_begin __unloader_loader_instruction_offset`
            unloaderCnt++;
        }
    }

    return

    print`uldr=${uldr}\n`
    print`unloaderCnt=${unloaderCnt}`
    print`[red]__unloader_loader_set_begin = ${getVar("__unloader_loader_set_begin")}\n`
    print`[cyan]${getVar("__unloader1")}\n`
    print`[cyan]${getVar("__unloader2")}\n`
    print`[cyan]${getVar("__unloader3")}\n`
    print`[cyan]${getVar("__unloader4")}\n`
    print`[cyan]${getVar("__unloader5")}\n`
    print`[cyan]${getVar("__unloader6")}\n`
    printFlush()
    stopScript()
}

function handleElementaryFactory(blk, unitOffset) {
    print`Handling elementary factory ${blk} (first unit offset = ${unitOffset})`
    printFlush()
    // wait(1)
    while (true) {
        if (dataArray[unitOffset] == blk.config) {
            handleSpecifiedFactory(blk, unitOffset + 1)
            break;
        } else {
            print`${dataArray[unitOffset]} does not match current config ${blk.config}, therefore jumped from ${unitOffset} `
            unitOffset += 1
            while (dataArray[unitOffset] !== undefined) {
                unitOffset += 2
            }
            print`to index ${unitOffset}`
            printFlush()
            // wait(0.7)
            unitOffset += 1
            if (dataArray[unitOffset] === undefined) {
                // end of unit list
                break;
            }
        }
    }
}

function init() {
    // loadUnloaders()
    // unloader = getFirst(Blocks.unloader)
    loadUnloaders()
    container = getFirst(Blocks.container) ?? getFirst(Blocks.vault) ?? getFirst(Blocks.coreFoundation) ?? getFirst(Blocks.coreNucleus) ?? getFirst(Blocks.coreShard)
}

function main() {
    for (var i = 0; i < Vars.links; i++) {
        const blk = getLink(i)
        const blkFactoryOffset = getFactoryDataOffset(blk.type)
        print`Block [red]${blk}[] appears at pos ${blkFactoryOffset}([red]${dataArray[blkFactoryOffset]}[]) in table. ` // must check boundaries
        printFlush()
        if (blkFactoryOffset >= 0) {
            if (isElementaryFactory(blk.type)) {
                handleElementaryFactory(blk, blkFactoryOffset + 1)
            } else {
                handleSpecifiedFactory(blk, blkFactoryOffset + 1)
            }
        }
    }
}

function checkState() {
    if (Vars.links != initialLinks) endScript()
    return true;
}

// use unchecked to improve performance

function getFirst(type): AnyBuilding {
    for (var i = 0; i < Vars.links; i++) {
        const node = getLink(i);
        if (node.type == type) {
            return node;
        }
    }
    return undefined;
}