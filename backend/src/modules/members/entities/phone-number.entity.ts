import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity({ name: 'phone_numbers' })
export class PhoneNumber {
  @PrimaryGeneratedColumn({
    name: 'phone_id',
  })
  phoneId!: number;

  @Column({
    name: 'user_id',
    type: 'integer',
  })
  userId!: number;

  @Column({
    name: 'operator_id',
    type: 'integer',
  })
  operatorId!: number;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 20,
    unique: true,
  })
  phoneNumber!: string;

  @Column({
    name: 'account_number',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  accountNumber!: string | null;

  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
  })
  isPrimary!: boolean;

  @Column({
    name: 'phone_status',
    type: 'varchar',
    length: 20,
    default: 'Active',
  })
  phoneStatus!: string;

  // 'Standard' (one active SIM per operator per NIDA) or 'M2M' (up to
  // four active SIMs per operator — IoT/router/tracking devices). The
  // cap itself is enforced in MembersService, not by a DB constraint —
  // see migration 0030's header comment for why.
  @Column({
    name: 'sim_type',
    type: 'varchar',
    length: 20,
    default: 'Standard',
  })
  simType!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.phoneNumbers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'userId',
  })
  user!: User;
}
