import Dexie, { type EntityTable } from 'dexie';
import type { Diagnosis, EffectBoard, OriginalPedal, Person } from '../types';

export const SCHEMA_VERSION = 1;

export class BirthCodeDB extends Dexie {
  persons!: EntityTable<Person, 'id'>;
  diagnoses!: EntityTable<Diagnosis, 'id'>;
  boards!: EntityTable<EffectBoard, 'id'>;
  pedals!: EntityTable<OriginalPedal, 'id'>;

  constructor(name = 'birth-code') {
    super(name);
    this.version(SCHEMA_VERSION).stores({
      persons: 'id, displayName, birthDate, createdAt, updatedAt',
      diagnoses: 'id, personId, executedAt',
      boards: 'id, personId, diagnosisId',
      pedals: 'id, personId, diagnosisId, createdAt',
    });
  }
}

export const db = new BirthCodeDB();
