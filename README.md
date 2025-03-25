# DB 조회 성능 향상

상태: 진행 중

# 목표

1억 개의 정보가 들어있을 때 조회 시간을 얼만큼 줄일 수 있을까
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

# 성능 개

실제 서비스에서는 캐시를 활용하면 더 빠른 속도로 조회를 할 수 있다.
하지만 이번에는 캐시에 의존하지 않고 성능을 최대한 개선해보고 싶다.

## 성능 개선을 위해 적용해볼 것

### 1. 인덱스

위의 조회시간을 비교해봤을 때 인덱스를 만들어주는 것이 조회하는 데 있어 상당히 유리한 것을 알 수 있다.
그렇다면 모든 칼럼, 모든 조건에 대해 인덱스를 다 만드는 것이 무조건 유리할까?
그것은 아니다.

왜나하면 조회를 하는 데 있어서 유리할 수는 있지만 데이터 삽입, 수정, 삭제 등 다른 작업할 때는 인덱스까지 수정이 되므로 시간이 더 오래 걸릴 수 있다.

그렇기 때문에 적절한 곳에 필요한 만큼만 만드는 것이 중요하고 시간 측정 등을 하며 최적으로 적용시키면 된다.

### 2. 파티셔닝

논리적으로 하나의 테이블이지만 실제로는 여러 개의 테이블로 분리해 관리하는 기능
주로 대용량의 테이블을 물리적으로 여러 개의 소규모 테이블로 분산하는 목적으로 사용

파티션은 유리한 상황이 분명 존재하지만, 쿼리에 따라 오히려 성능이 나빠질 수 있다. 그렇다면 언제 사용해야 좋을까

1. 무거운 인덱스 - 인덱스가 많이 걸려있는 경우

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%2010.png)

UPDATE나 DELETE 쿼리를 처리하기 위해서는 인덱스를 통한 검색이 필수이다
하지만 인덱스가 커질수록 SELECT, INSERT, UPDATE, DELETE 작업이 함께 느려진다.

위의 이미지를 보면 파티션하지 않고 큰 테이블을 사용하면 인덱스도 함께 커지며, 그만큰 물리적인 메모리 공간도 많이 필요하다는 것을 알 수 있다.

1. Working Set 기준으로 나눌 수 있는 경우

데이터의 특성에는 전체 데이터 셋에서 자주 찾게 되는 데이터 그룹이 존재하게 되는데
이렇게 모든 데이터 중에서 활발히 사용되는 데이터를 Working Set이라고 한다.

테이블의 데이터는 실질적인 물리 메모리보다 큰 것이 일반적이겠지만,
인덱스의 Working Set이 실질적인 물리 메모미보다 크다면 쿼리 처리가 상당히 느려질 것이다.

따라서 테이블의 데이터를 활발하게 사용되는 Working Set과 그 외의 부분으로 나눠서 파티션할 수 있다면 상당히 효과적으로 성능을 개선할 수 있을 것이다.

### 3. 샤딩

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%2011.png)

DB 트래픽을 분산할 수 있는 중요한 수단이다
추가적으로 특정 DB의 장애가 전면 장애로 이어지지 않게 하는 역할도 한다.
즉, 샤딩은 각 DB 서버에서 데이터를 분할하여 저장하는 방식

왜 필요할까?
기존의 데이터베이스 시스템은 단일 서버에서 모든 데이터를 처리하므로 데이터 양이 많아질수록 성능 저하나 확장에 어려움을 겪을 수 있다.
이에 비해 샤딩은 데이터를 분산시킴으로써 여러 대의 서버를 사용하고 병렬로 처리함으로써 확장성과 성능을 향상시킬 수 있다.

파티셔닝과 샤딩의 차이점

파티셔닝 : 동일한 DB 서버 내에 테이블을 분할

샤딩 : DB 서버를 분할하는 것

# 인덱스(Index)

```sql
SELECT username, email, age FROM users LIMIT 110000000;
```

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%2012.png)

인덱스 적용 전 조회 평균 시간 : 약 35초

아래의 인덱스를 적용해보자.

```sql
CREATE INDEX idx_cover_username_email_age ON users(username, email, age);
```

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%2013.png)

데이터가 너무 많아 적용도 실패했다..

해결하는 방법

- 백그라운드에서 실행하기
워크벤치과 같은 GUI 툴은 커넥션 타임아웃에 걸리기 쉽다.
아래의 코드를 이용해 CLI 실행을 한 수 시도해보자!
    
    ```sql
    mysql -u root -p 
    ALTER TABLE users ADD INDEX idx_cover_username_email_age (username, email, age);
    ```
    

적용 후 실행 결과 : 36.2초

![한 번만 실행해보았다](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%2014.png)

한 번만 실행해보았다

이런 것을 조회를 해보지 않아도 성능이 개선이 되었는지 알 수 있는 방법이 있다
바로 EXPLAIN을 사용하는 것이다!

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%2015.png)

type이라는 칼럼을 확인해보면 index라고 적혀있다.
이것은 인덱스를 통한 조회를 하지만 모든 것을 조회하는 것이다 

사실 위의 조회는 결국 Full Table Scan이기 때문에 인덱스를 적용하더라도 걸리는 시간은 비슷하다
이런 경우에는 인덱스 외에 다른 방법으로 성능을 향상시키는 것이 좋을 것 같다(예: 파티셔닝, 샤딩 → 적용 예정) 

---

기존의 인덱스를 삭제하고 다음 쿼리에 해당하는 성능 개선을 해보겠다

```sql
SELECT username, email, age FROM users WHERE created_at > '2024-01-01'; LIMIT 110000000;
```

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%2016.png)

조건이 추가 되었을 때 평균 시간 : 39.6초 
조건이 걸려있는 것이 시간이 훨씬 많이 걸린다는 것을 알 수 있다

```sql
-- 인덱스 삭제
DROP INDEX idx_cover_username_email_age ON users;
-- 삭제 확인
SHOW INDEX FROM users;
-- 인덱스 생성
CREATE INDEX idx_created_at_userinfo ON users(created_at, username, email, age);
```

위와 같이 생성한 이유 : MySQL은 왼쪽부터 차례대로 사용할 수 있다. 그렇기 때문에 가장 왼쪽에 우리가 이번에 사용할 쿼리의 조건인 create_at을 가장 앞으로 오게 했다 

이렇게 할 경우 create_at이 포함된 WHERE문에서는 이 인덱스가 적용이 될 것이다.

<aside>
💡

그냥 create_at 칼럼만을 이용한 싱글 칼럼 인덱스를 만들면 안 되나?

- - 싱글 컬럼 인덱스
CREATE INDEX idx_created_at ON users(created_at);
- - 멀티 컬럼 인덱스
CREATE INDEX idx_created_at_userinfo ON users(created_at, username, email, age);

단순히 `WHERE created_at > ‘2024-01-01’`이라는 조건에서는 인덱스로 조건에 맞는 row 값을 찾을 수 있다.
하지만 현재 우리가 조회하는 칼럼(username, email, age)를 조회할 때는 테이블에 접근을 하여 값을 다시 읽어야 한다. 
따라서 테이블에 접근할 필요없이 인덱스만으로 조회를 할 수 있게 멀리 칼럼 인덱스로 만들어주는 것이 좋다

</aside>

EXPLAIN을 통해 확인해보자

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%2017.png)

type을 확인해보니 range라고 되어있다. 이것은 인덱스를 활용해 범위 조회를 하는 것이다

![image.png](DB%20%E1%84%8C%E1%85%A9%E1%84%92%E1%85%AC%20%E1%84%89%E1%85%A5%E1%86%BC%E1%84%82%E1%85%B3%E1%86%BC%20%E1%84%92%E1%85%A3%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC%201bf81d8a13f08004931ee7c77908fdce/image%2018.png)

평균 시간 : 42.3초

적용 전보다 오래 걸렸다..  실행을 3번 밖에 안 시켰기 때문에 완전 정확다고는 할 수 없지만 한 가지 확실히 알 수 있는 것은 인덱스 적용 전과 달라진 것이 없다

EXPLAIN 결과의 rows를 봐보자 약 7500만개
전체 양에 비해서는 줄었지만 상당한 숫자이다. 그렇기 때문에 인덱스를 적용했음에도 불구하고 시간이 오래 걸리는 것이다.

- 해결 방법 모색
    1. 쿼리를 나눠서 처리한다 
        
        ```sql
        -- 날짜 기준
        WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31';
        
        -- id 기준 
        WHERE id BETWEEN 1 AND 10000000;
        ```
        
    2. 파티셔닝 적용

# 파티셔닝 (Partitioning)

파티셔닝에서는 조건이 있다.

1. 

# 출처

[MySQL Partition, 제대로 이해하기 (1)](https://gngsn.tistory.com/203)

[[데이터베이스] 샤딩(Sharding)이란?](https://velog.io/@kyeun95/%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4-%EC%83%A4%EB%94%A9Sharding%EC%9D%B4%EB%9E%80)
