# DB 조회 성능 향상

상태: 진행 중

# 목표

한 테이블에 1억 개의 정보가 들어있을 때 조회 시간을 얼만큼 줄일 수 있을까
⇒ 우선 목표는 조회를 했을 때 0.2m/s 정도이다

# 환경

CPU: m2 pro
RAM: 16GB
OS : mac OS Sequoia 15.1.1
DB : mysql  Ver 9.2.0 for macos15.2 on arm64 (Homebrew)

# 데이터 삽입

## Nestjs를 이용해서 넣기

우선 코드를 짜고 1만 개를 넣어보았다

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image.png)

typeOrm을 사용한 걸 감안하더라도 1만개를 넣는데 너무 많은 시간이 요소된다..

그래서 나는 DB에 더미데이터를 직접 넣기로 했다

- Nestjs 코드 보기
    
    ```tsx
    import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
    
    @Entity('users')
    export class User {
      @PrimaryGeneratedColumn()
      id : number;
    
      @Column()
      userName : string;
    
      @Column()
      email : string;
    
      @Column()
      age : number;
    
      @Column()
      created_at : Date;
    }
    ```
    
    ```tsx
    import 'dotenv/config';
    import { DataSource } from 'typeorm';
    import { User } from '../entities/user.entity';
    import { performance } from 'perf_hooks';
    
    const BATCH_SIZE = 10_000; // 초 소모
    const TOTAL_COUNT = 100_000_000; // 초 소모
    
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
    ```
    

## 워크벤치

한 번에 1억 개의 데이터를 삽입하는 것은 DB에 상당한 부하를 준다.
    ⇒ 시도는 해보았으나 중간에 에러가 발생한다.
그렇기 때문에 1천 개씩 10번 삽입을 하기로 하였다.

~~넣다보니 1.1억개 넣었다.~~

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%201.png)

```sql
-- 1천만개 더미데이터 삽입 코드

SET @row := IFNULL(@row, 0);

INSERT INTO users (userName, email, age, created_at)
SELECT
  CONCAT('user', @row := @row + 1),
  CONCAT('user', @row, '@test.com'),
  FLOOR(RAND() * 100),
  NOW()
FROM (
  SELECT 1 FROM
    (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
    (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b,
    (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c,
    (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d,
    (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) e,
    (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) f,
    (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) g
) dummy
LIMIT 10000000;
```

- 모든 칼럼을 조회를 하니 평균 약55초가 소모된다.

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%202.png)

- id 칼럼만 모두 조회했을 때 약 21초가 소모된다.

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%203.png)

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%204.png)

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%205.png)

- 테이블을 만들면 기본적으로 id에는 인덱스가 만들어진다 그렇기 때문에 
`SELECT * FROM users WHERE id = 110000000` 와 같이 검색을 하면 아주 빠르게 검색을 할 수 있다
    
    ![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%206.png)
    
    - EXPLAIN을 통해 확인해본 결과 `type = const` 로 가장 최적의 방법으로 조회를 한다.
        
        ![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%207.png)
        
- 하지만 인덱스가 없는 조건(`SELECT id FROM users WHERE userName = 'user20000100';`)으로 
검색을 할 경우 오랜 시간 검색을 하다 에러가 났다
    
    ![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%208.png)
    
    - EXPLAIN을 통해 확인해본 결과 `type = all` 
    즉, Full Table Scan으로  최악의 방법으로 조회를 한다.
        
        ![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%209.png)
        

### 인덱스 type 우선순위

| 우선순위 | type값 | 설명 |
| --- | --- | --- |
| 1 | system | 단 1건만 있는 테이블 ( 거의 사용 안 됨) |
| 2 | const | PK나 Unique Index를 통한 단건 조회( 매우 빠르다) |
| 3 | eq_ref | Join에서 PK를 사용하는 경우 |
| 4 | ref | 일반 인덱스를 사용하는 경우 |
| 5 | range | 인데스를 활용한 범위 조회(BETWEEN, <, >) |
| 6 | index | 인덱스를 읽지만, 모든 인덱스를 스캔 |
| 7 | ALL | Full Table Scan, 가장 느림 |

# 성능 개선

실제 서비스에서는 캐시를 활용하면 더 빠른 속도로 조회를 할 수 있다.
하지만 이번에는 캐시에 의존하지 않고 성능을 최대한 개선해보고 싶다.

## 성능 개선을 위해 적용해볼 것

1. 커버링 인덱스
2. 파티셔닝
3. 샤딩
