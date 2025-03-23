import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { performance } from 'perf_hooks';

const BATCH_SIZE = 10_000; // 초 소모
const TOTAL_COUNT = 90_000_000; // 초 소모

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT!,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User],
  synchronize: false,
  logging: false,
});

async function seed() {
  const start = performance.now();

  await AppDataSource.initialize();
  console.log('DB 연결 성공');

  const userRepo = AppDataSource.getRepository(User);

  for (let batch = 0; batch < TOTAL_COUNT / BATCH_SIZE; batch++) {
    const users: User[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const index = batch * BATCH_SIZE + i;
      const user = new User();
      user.userName = `user${index}`;
      user.email = `user${index}@test.com`;
      user.age = Math.floor(Math.random() * 100);
      user.created_at = new Date();
      users.push(user);
    }

    await userRepo.insert(users);
    console.log(`✅ ${batch + 1} / ${TOTAL_COUNT / BATCH_SIZE} 배치 완료`);
  }

  await AppDataSource.destroy();

  const end = performance.now(); 
  const seconds = ((end - start) / 1000).toFixed(2); // 삽입 총 시간 계산

  console.log(`더미 데이터 삽입 완료`);
  console.log(`총 소요 시간: ${seconds}초`);
}

seed();