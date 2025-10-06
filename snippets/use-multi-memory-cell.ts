// not tested
var bank1: AnyBuilding = undefined
var bank2: AnyBuilding = undefined
var bank3: AnyBuilding = undefined

; (
    function () {
        var count = 0
        for (var i = 0; i < Vars.links; i++) {
            const node = getLink(i)
            if (node.type == Blocks.memoryCell) {
                if (count == 0) {
                    bank1 = node
                } else if (count == 1) {
                    bank2 = node
                } else {
                    bank3 = node
                    break
                }
                count++
            }
        }

        if (bank3 === undefined) {
            function drawAt(x, y) {
                draw.color(255, 255, 255)
                draw.image({ x: x, y: D - y, image: Blocks.memoryCell, size: 30, rotation: 0 });

                draw.stroke(3)
                draw.color(180, 0, 0)
                draw.line({ x: x - 10, y: D - y + 10, x2: x + 10, y2: D - y - 10 })
            }

            draw.clear(80, 80, 80)
            drawAt(20, 20)
            if (bank2 === undefined) {
                drawAt(60, 20)
            }
            if (bank1 === undefined) {
                drawAt(20, 60)
            }
            drawFlush()

            while (Vars.links == initialLinks);
            endScript()
        }
    }
)()

const mem1 = new Memory(bank1, 64)
const mem2 = new Memory(bank2, 64)
const mem3 = new Memory(bank3, 64)

function setMem(index, value) {
    var instructionOffset = (index >> 5) - 1 // 1 -> 1, 2 -> 3, 3 -> 5
    asm`op add __setmem_begin @counter ${instructionOffset}`
    label: {
        asm`write ${value} ${bank1} ${index}`
        break label
        asm`write ${value} ${bank2} ${index}`
        break label
        asm`write ${value} ${bank3} ${index}`
        break label
    }
}
