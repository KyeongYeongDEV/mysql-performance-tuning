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