import type { IdProfile } from '../types';
import { generic } from './generic';
import { klh } from './klh';

const PROFILES: IdProfile[] = [klh, generic];

export const DEFAULT_PROFILE_ID = klh.id;

export const listProfiles = (): IdProfile[] => PROFILES;

export const getProfile = (id: string): IdProfile => PROFILES.find((p) => p.id === id) ?? generic;
