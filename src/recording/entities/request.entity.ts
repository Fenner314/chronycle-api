import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('requests')
@Index(['apiId', 'endpoint'])
@Index(['timestamp'])
@Index(['userId'])
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  apiId: string;

  @Column()
  endpoint: string;

  @Column()
  method: string;

  @Column('jsonb')
  headers: Record<string, any>;

  @Column('jsonb', { nullable: true })
  queryParams: Record<string, any>;

  @Column('text', { nullable: true })
  requestBody: string;

  @Column('jsonb')
  responseHeaders: Record<string, any>;

  @Column()
  statusCode: number;

  @Column('text', { nullable: true })
  responseBody: string;

  @Column()
  duration: number; // in milliseconds

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;
}
