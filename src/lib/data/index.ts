import { QrifyDB } from './db';
import { createRepo } from './repo';

export const repo = createRepo(new QrifyDB());
export type { EventSummary, AddResult } from './repo';
