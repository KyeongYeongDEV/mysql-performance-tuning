"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const perf_hooks_1 = require("perf_hooks");
const BATCH_SIZE = 10_000;
const TOTAL_COUNT = 100_000_000;
const AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [user_entity_1.User],
    synchronize: false,
    logging: false,
});
async function seed() {
    const start = perf_hooks_1.performance.now();
    await AppDataSource.initialize();
    console.log('DB 연결 완료');
    const userRepo = AppDataSource.getRepository(user_entity_1.User);
    for (let batch = 0; batch < TOTAL_COUNT / BATCH_SIZE; batch++) {
        const users = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            const index = batch * BATCH_SIZE + i;
            const user = new user_entity_1.User();
            user.userName = `user${index}`;
            user.email = `user${index}@test.com`;
            user.age = Math.floor(Math.random() * 100);
            user.createdAt = new Date();
            users.push(user);
        }
        await userRepo.insert(users);
        console.log(`✅ ${batch + 1} / ${TOTAL_COUNT / BATCH_SIZE} 배치 완료`);
    }
    await AppDataSource.destroy();
    const end = perf_hooks_1.performance.now();
    const seconds = ((end - start) / 1000).toFixed(2);
    console.log(`더미 데이터 삽입 완료`);
    console.log(`총 소요 시간: ${seconds}초`);
}
seed();
//# sourceMappingURL=users.js.map