asm`set program "snake-game"`;
asm`set version "1.0"`;
const HEIGHT = 20;
const WIDTH = 20;
let offsetX = 0;
let offsetY = 0;
let blockSize = 4;
while (!getBuilding('display1')) { }
if (getBuilding('display1').type === Blocks.largeLogicDisplay) {
    blockSize = 8;
    offsetX = 8;
    offsetY = 8;
}

function scanInput() {
    if (getBuilding('switch1').enabled) {
        control.enabled(getBuilding('switch1'), false);
        return 'up';
    }
    if (getBuilding('switch2').enabled) {
        control.enabled(getBuilding('switch2'), false);
        return 'left';
    }
    if (getBuilding('switch3').enabled) {
        control.enabled(getBuilding('switch3'), false);
        return 'right';
    }
    if (getBuilding('switch4').enabled) {
        control.enabled(getBuilding('switch4'), false);
        return 'down';
    }
    return undefined;
}

const bitmap = new MutableArray<number>(HEIGHT * WIDTH / 16);
bitmap.fill(0);

function bitmapGet(x: number, y: number) {
    const idx = x * HEIGHT + y;
    let word = bitmap[Math.floor(idx / 16)];
    return (word & (1 << (idx % 16))) != 0;
}

function bitmapSet(x: number, y: number, val: boolean) {
    const idx = x * HEIGHT + y;
    let word = bitmap[Math.floor(idx / 16)];
    if (val) {
        bitmap[Math.floor(idx / 16)] |= word | (1 << (idx % 16));
    } else {
        bitmap[Math.floor(idx / 16)] = word & ~(1 << (idx % 16));
    }
}

const queue = new MutableArray<number>(100);
let queueSize = 0;
let head = 0;
let tail = 0;

function push(x: number, y: number) {
    queue[head++] = (x << 8) | y;
    if (head >= queue.size) {
        head = 0;
    }
    queueSize++;
}

function peek() {
    let val = queue[head - 1];
    return val;
}

function dequeue() {
    const val = queue[tail];
    tail++;
    if (tail >= queue.size) {
        tail = 0;
    }
    queueSize--;
    return val;
}

function unpackX(val: number) {
    return (val & 0xff00) >> 8;
}

function unpackY(val: number) {
    return val & 0x00ff;
}

type Color = [number, number, number];
const colorAir: Color = [0, 0, 0];
const colorBody: Color = [200, 200, 200];
const colorHead: Color = [255, 255, 0];
const colorFood: Color = [255, 0, 0];

function drawBlock(x: number, y: number, [r, g, b]: Color) {
    draw.color(r, g, b);
    draw.rect({
        x: offsetX + x * blockSize,
        y: offsetY + (HEIGHT - 1 - y) * blockSize,
        height: blockSize,
        width: blockSize
    });
}

draw.clear(0, 0, 0);
draw.color(255, 255, 255);
draw.lineRect({
    x: offsetX - 1, y: offsetY - 1,
    width: WIDTH * blockSize + 2, height: HEIGHT * blockSize + 2
});
drawFlush();
scanInput(); // clear input state

let cx = 0, cy = 0;
let foodx, foody;
let direction = 'right';

let headx = 3, heady = 3;
putHead(3, 3);
putHead(4, 3);
putHead(5, 3);
drawFlush();

function putHead(x, y) {
    drawBlock(headx, heady, colorBody);
    drawBlock(x, y, colorHead);
    push(x, y);
    bitmapSet(x, y, true);
    headx = x;
    heady = y;
}

function getDirectionAxis(direction: string) {
    if (direction === 'left' || direction === 'right') return 'x';
    if (direction === 'up' || direction === 'down') return 'y';
}

function generateFood() {
    do {
        foodx = Math.floor(Math.rand(WIDTH));
        foody = Math.floor(Math.rand(HEIGHT));
    } while (bitmapGet(foodx, foody));
    drawBlock(foodx, foody, colorFood);
}

generateFood();
drawFlush();

while (!scanInput()) { }

while (1) {
    wait(0.1);
    let key = scanInput();
    if (key) {
        if (getDirectionAxis(key) !== getDirectionAxis(direction)) {
            direction = key;
        }
    }

    let nextx = headx;
    let nexty = heady;
    switch (direction) {
        case 'up': nexty -= 1; break;
        case 'left': nextx -= 1; break;
        case 'right': nextx += 1; break;
        case 'down': nexty += 1; break;
    }
    print`x${nextx} y${nexty} ${direction} len${queueSize} ${bitmapGet(nextx, nexty)}`
    printFlush();
    if (nextx < 0 || nextx >= WIDTH || nexty < 0 || nexty >= HEIGHT
        || bitmapGet(nextx, nexty)) {
        gameover();
    }
    putHead(nextx, nexty);
    if (headx === foodx && heady === foody) {
        generateFood();
        drawFlush();
    } else {
        const tailval = dequeue();
        const tailx = unpackX(tailval);
        const taily = unpackY(tailval);
        drawBlock(tailx, taily, colorAir);
        drawFlush();
        bitmapSet(tailx, taily, false);
    }
}

function gameover() {
    draw.color(255, 0, 0, 10);
    for (let i = 0; i < 20; i++) {
        draw.rect({ x: 0, y: 0, height: 200, width: 200 });
        drawFlush();
    }
    wait(2);
    draw.color(0, 0, 0, 30);
    for (let i = 0; i < 20; i++) {
        draw.rect({ x: 0, y: 0, height: 200, width: 200 });
        drawFlush();
    }
    endScript();
}
