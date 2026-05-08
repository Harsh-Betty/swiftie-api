import type { Logger } from './logger';

export type FillScope = {
  kind: 'album' | 'song';
  albumSlug: string;
  songSlug?: string;
};

export type FillEvent = {
  scope: FillScope;
  source: string;
  field: string;
  before: unknown;
  after: unknown;
  forced?: boolean;
};

export type ErrorEvent = {
  scope: string;
  source: string;
  message: string;
};

type AdapterStat = {
  fieldsFilled: number;
  fieldsUnchanged: number;
  errors: number;
};

export type UnchangedEvent = {
  scope: FillScope;
  source: string;
  field: string;
};

function emptyStat(): AdapterStat {
  return { fieldsFilled: 0, fieldsUnchanged: 0, errors: 0 };
}

export class Summary {
  private fills: FillEvent[] = [];
  private errors: ErrorEvent[] = [];
  private adapterTotals = new Map<string, AdapterStat>();

  recordFill(event: FillEvent): void {
    this.fills.push(event);
    const stat = this.adapterTotals.get(event.source) ?? emptyStat();
    stat.fieldsFilled += 1;
    this.adapterTotals.set(event.source, stat);
  }

  recordUnchanged(event: UnchangedEvent): void {
    const stat = this.adapterTotals.get(event.source) ?? emptyStat();
    stat.fieldsUnchanged += 1;
    this.adapterTotals.set(event.source, stat);
  }

  recordError(scope: string, source: string, err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    this.errors.push({ scope, source, message });
    const stat = this.adapterTotals.get(source) ?? emptyStat();
    stat.errors += 1;
    this.adapterTotals.set(source, stat);
  }

  fillsForAlbum(albumSlug: string): FillEvent[] {
    return this.fills.filter((f) => f.scope.albumSlug === albumSlug);
  }

  print(logger: Logger, dryRun: boolean): void {
    logger.info('--- Ingest summary ---');
    if (this.adapterTotals.size === 0) {
      logger.info('No adapters produced any changes.');
    }
    for (const [source, stat] of this.adapterTotals) {
      logger.info(
        {
          adapter: source,
          fieldsFilled: stat.fieldsFilled,
          fieldsUnchanged: stat.fieldsUnchanged,
          errors: stat.errors,
        },
        `[${source}]`,
      );
    }

    if (dryRun && this.fills.length > 0) {
      logger.info('--- Dry-run diff ---');
      const byAlbum = new Map<string, FillEvent[]>();
      for (const event of this.fills) {
        const list = byAlbum.get(event.scope.albumSlug) ?? [];
        list.push(event);
        byAlbum.set(event.scope.albumSlug, list);
      }
      for (const [albumSlug, events] of byAlbum) {
        logger.info(`# ${albumSlug}`);
        for (const event of events) {
          const target =
            event.scope.kind === 'song'
              ? `songs/${event.scope.songSlug}.${event.field}`
              : event.field;
          const tag = event.forced ? 'override' : event.source;
          logger.info(
            `  [${tag}] ${target}: ${formatValue(event.before)} -> ${formatValue(event.after)}`,
          );
        }
      }
    }

    if (this.errors.length > 0) {
      logger.warn(`--- ${this.errors.length} error(s) ---`);
      for (const err of this.errors) {
        logger.warn(`  [${err.source}] ${err.scope}: ${err.message}`);
      }
    }
  }
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'unset';
  if (typeof value === 'string') return value === '' ? '""' : JSON.stringify(value);
  return JSON.stringify(value);
}
