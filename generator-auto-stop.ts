// experimental

// Goal:
// 1. When there is too much power, stop gradually generators to save resources
//    1) Definition of "too much power" should be predictive, i.e. be able to take into account execution latency and consumption trending. 
//    2) Excessive stopping should be prevented with best efforts. That's why generators should be stopped "gradually".
//       One way to solve this is to introduce randomness to de-align multiple processors. 
// 2. The order of stopping generators should preferably be based on two factors
//    1) How long it will take for the generators to restart
//    2) How much power the generator can output
//    This can be approximated for performance concerns.
// 3. (Extended)
//    Interact with other processors, providing them with advice on stopping other reactors. 
//    (Impact Reactor and Thorium Reactors only)

var safetySeconds = 2;

while (true) {
    const firstBlock = getLink(0)
    const canSavePower = firstBlock.powerNetStored >= firstBlock.powerNetCapacity
        && firstBlock.powerNetCapacity > firstBlock.powerNetOut * safetySeconds;

    for (var i = 0; i < Vars.links; i++) {
        const b = getLink(i)
        if (b.type == Blocks.impactReactor) {
            continue; // not allowed
        } else if (b.type == Blocks.thoriumReactor) {
            continue;
        }

        control.enabled(b, !canSavePower)
    }
}