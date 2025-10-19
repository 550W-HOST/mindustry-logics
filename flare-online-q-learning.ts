// This script is used for the flare learning when attacking and repairing buildings.

// 强化学习参数
const learningRate = 0.5;
const discountFactor = 0.8;
const epsilon = 0.1; // 10% 的概率随机选择动作，进行探索

// 状态和动作的枚举
const enum Action {
    Attack = 0,
    Repair = 1,
}

// 使用内存单元来存储 Q-table
const qTable = new Memory(getBuilding("cell1"), 8);

// 初始化 Q-table (如果还没初始化的话)
if (qTable[0] === undefined) {
    for (let i = 0; i < 8; i++) {
        qTable[i] = 0;
    }
}

// 绑定一个小飞机
unitBind(Units.flare);

// 主循环
while (true) {
    // 1. 获取当前状态 (State)
    const enemy = unitRadar({
        filters: ["enemy", "any", "any"],
        order: true,
        sort: "distance",
    });
    const [damagedFound, , , damagedBuilding] = unitLocate.damaged();

    const hasEnemy = enemy !== undefined && enemy.team !== Vars.unit.team;
    const hasDamagedBuilding = damagedFound;

    const state = (hasEnemy ? 1 : 0) * 2 + (hasDamagedBuilding ? 1 : 0);

    // 2. 选择动作 (Action) - Epsilon-Greedy 策略
    let action: Action;
    if (Math.rand(1) < epsilon) {
        // 探索：随机选择动作
        action = Math.rand(1) > 0.5 ? Action.Attack : Action.Repair;
    } else {
        // 利用：选择 Q-value 最高的动作
        const attackQ = qTable[state * 2 + Action.Attack];
        const repairQ = qTable[state * 2 + Action.Repair];
        action = attackQ > repairQ ? Action.Attack : Action.Repair;
    }

    // 3. 执行动作
    const previousHealth = Vars.unit.health;
    if (action === Action.Attack && hasEnemy) {
        unitControl.targetp({ unit: enemy, shoot: true });
    } else if (action === Action.Repair && hasDamagedBuilding) {
        unitControl.approach({ x: damagedBuilding.x, y: damagedBuilding.y, radius: 5 });
    } else {
        // 如果选择的动作无法执行，则闲置
        unitControl.idle();
    }

    // 等待一段时间让动作产生效果
    wait(0.5);

    // 4. 获取奖励 (Reward) 和新状态 (New State)
    let reward = 0;

    if (hasEnemy && Vars.unit.health < previousHealth) {
        // 受到攻击，给予惩罚
        reward -= 1;
    }

    if (action === Action.Attack && hasEnemy) {
        // 攻击敌人，给予奖励
        reward += 1;
    }

    if (action === Action.Repair && hasDamagedBuilding) {
        // 靠近受损建筑准备修复，给予奖励
        // 一个更复杂的奖励机制可以检查建筑的血量是否真的增加了
        reward += 1;
    }

    // 获取新的状态
    const nextEnemy = unitRadar({
        filters: ["enemy", "any", "any"],
        order: true,
        sort: "distance",
    });
    const [nextDamagedFound] = unitLocate.damaged();
    const nextHasEnemy = nextEnemy !== undefined && nextEnemy.team !== Vars.unit.team;
    const nextHasDamagedBuilding = nextDamagedFound;
    const nextState = (nextHasEnemy ? 1 : 0) * 2 + (nextHasDamagedBuilding ? 1 : 0);

    // 5. 更新 Q-table
    const oldQ = qTable[state * 2 + action];
    const maxNextQ = Math.max(
        qTable[nextState * 2 + Action.Attack],
        qTable[nextState * 2 + Action.Repair],
    );

    const newQ =
        oldQ + learningRate * (reward + discountFactor * maxNextQ - oldQ);
    qTable[state * 2 + action] = newQ;

    // 打印一些调试信息
    print`State: ${state}, Action: ${action}, Reward: ${reward}, New Q: ${newQ}\n`;
    printFlush();
}
