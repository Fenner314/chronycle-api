import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { ApiKey } from '../../api-keys/entities/api-key.entity';

@Entity('requests')
@Index(['apiId', 'endpoint'])
@Index(['timestamp'])
@Index(['apiKeyId'])
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  apiKeyId: string;

  @ManyToOne(() => ApiKey, { onDelete: 'CASCADE' })
  apiKey: ApiKey;

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
