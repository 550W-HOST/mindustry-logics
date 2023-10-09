/*

Notice of proper use:
You must use overflow gate (or inverted overflow gate) to distribute blast compounds.
When deploying, 
you must select in the order from the most priotized to least priotized in receiving resources.


 */

var _Reactor = "Controller"

// At least 30K of power storage is required to launch an impact reactor
const powerConsumptionToLaunchReactor = 30000;

// At least 20 blast compounds are required to launch an impact reactor and make up the power drew during the start-up process
const minimumFuelToLaunchReactor = 20;

const minimumTimeToLaunchReactor = 23; // seconds

const reactorSuccessfullyLaunchedThreshold = 0.9;

const initialLinks = Vars.links;

const container = getFirst(Blocks.container) ?? getFirst(Blocks.vault)

var timePermitNextReactorStopping = 0
var lastAverageFuel = 0

var timeLastUpdateContainerFuel = 0
var lastContainerFuel = 0

while (Vars.links == initialLinks) {
    mainLoop()
}

function mainLoop() {
    var reactorCounter = 0
    var fuelCount = 0

    var hasReactorStarting = false;
    // var lastStartedReactor: AnyBuilding = undefined;

    var minFuelAmongRunningReactors = 99;
    // var maxFuelAmongRunningReactors = 0;
    // var maxFuelAtLink = -1;

    for (var i = 0; i < Vars.links; i++) {
        const reactor = getLink(i)
        if (reactor.type == Blocks.impactReactor) {
            // lastReactor = reactor;
            if (reactor.enabled) {
                var reactorHeat = reactor.heat;
                if (reactorHeat < 1e-3 || reactor.efficiency < 0.5) {
                    control.enabled(reactor, false)
                } else {
                    // reactor is enabled and will still be enabled
                    if (reactorHeat < reactorSuccessfullyLaunchedThreshold) {
                        hasReactorStarting = true;
                    }
                    const totalItems = reactor.totalItems
                    minFuelAmongRunningReactors = Math.min(minFuelAmongRunningReactors, totalItems)
                    // if (totalItems > maxFuelAmongRunningReactors) {
                    //     maxFuelAmongRunningReactors = maxFuelAmongRunningReactors
                    //     maxFuelAtLink = i;
                    // }
                }
            }
            ++reactorCounter;
            fuelCount += reactor[Items.blastCompound]
        }
    }

    function shouldStartNewReactor() {
        var averageFuel = fuelCount / reactorCounter;
        if (container === undefined) {
            // No buffer mode
            // var powerPrediction = doPowerPrediction(lastReactor)
            return averageFuel > 9
        } else {
            // buffered mode
            var containerFuel = container[Items.blastCompound]
            return averageFuel > 9 && containerFuel > 3 * minimumFuelToLaunchReactor
        }
    }

    if (shouldStartNewReactor()) {
        if (!hasReactorStarting) {
            // launch first unstarted reactor
            for (var i = 0; i < Vars.links; i++) {
                const re = getLink(i)
                if (re.type == Blocks.impactReactor) {
                    if (!re.enabled && re[Items.blastCompound] >= 9 && re[Liquids.cryofluid] > 1) {
                        if (doPowerPrediction(re)) {
                            print`launching ${i} power prediction = ${doPowerPrediction(re)}`
                            printFlush()
                            control.enabled(re, true)
                            break;
                        }
                    }
                }
            }
        }
    }

    function shouldStopReactor() {
        if (Vars.time < timePermitNextReactorStopping) {
            return false;
        }
        if (container === undefined) {
            return minFuelAmongRunningReactors < 5
        } else {
            // if stock has reached criteria but is climbing, do not stop 
            var containerFuel = container[Items.blastCompound]
            if (containerFuel < minimumFuelToLaunchReactor) {
                if (containerFuel > lastContainerFuel) {
                    lastContainerFuel = containerFuel
                    timeLastUpdateContainerFuel = Vars.time
                    return false;
                }
                lastContainerFuel = containerFuel
                timeLastUpdateContainerFuel = Vars.time
                return true;
            }
            lastContainerFuel = containerFuel
            timeLastUpdateContainerFuel = Vars.time
            return false;
        }
    }

    if (shouldStopReactor()) {
        timePermitNextReactorStopping = Vars.time + 10000
        // stop last reactor
        for (var i = Vars.links - 1; i >= 0; i--) {
            const re = getLink(i)
            if (re.type == Blocks.impactReactor) {
                if (re.enabled) {
                    control.enabled(re, false)
                    break;
                }
            }
        }
    }
}

function doPowerPrediction(node: AnyBuilding) {
    var powerDrainRate = node.powerNetOut - node.powerNetIn
    if (powerDrainRate < 0) return 1e9;
    return node.powerNetStored - powerDrainRate * minimumTimeToLaunchReactor >= powerConsumptionToLaunchReactor
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