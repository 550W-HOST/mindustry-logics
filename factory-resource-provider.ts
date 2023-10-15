const dataArray = new MutableArray([
    Blocks.groundFactory,
    Units.dagger, Items.lead, 10, Items.silicon, 10, undefined,
    Units.nova, Items.lead, 20, Items.silicon, 30, Items.titanium, 20, undefined,
    Units.crawler, Items.coal, 10, Items.silicon, 8, undefined,
    Blocks.airFactory,
    Units.flare, Items.silicon, 15, undefined,
    Units.mono, Items.lead, 15, Items.silicon, 30, undefined,
    Blocks.navalFactory,
    Units.risso, Items.silicon, 20, Items.metaglass, 35, undefined,
    Units.retusa, Items.silicon, 15, Items.metaglass, 25, Items.titanium, 20, undefined,
    Blocks.additiveReconstructor, Items.silicon, 40, Items.graphite, 40, undefined,
    Blocks.multiplicativeReconstructor, Items.silicon, 130, Items.titanium, 80, Items.metaglass, 40, undefined,
    Blocks.exponentialReconstructor, Items.silicon, 850, Items.titanium, 750, Items.plastanium, 650, undefined,
    Blocks.tetrativeReconstructor, Items.silicon, 1000, Items.plastanium, 600, Items.surgeAlloy, 500, Items.phaseFabric, 350, undefined
]) // 78 instructions

var unloader = undefined;
var container = undefined;

main()

function isFactory(v) {
    return v == Blocks.groundFactory || v == Blocks.airFactory || v == Blocks.navalFactory ||
        v == Blocks.additiveReconstructor || 
        v == Blocks.multiplicativeReconstructor || 
        v == Blocks.exponentialReconstructor || 
        v == Blocks.tetrativeReconstructor
}

function main() {
    unloader = getFirst(Blocks.unloader)
    container = getFirst(Blocks.container || Blocks.vault || Blocks.coreFoundation)
    
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