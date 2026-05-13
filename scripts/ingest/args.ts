import { parseArgs as nodeParseArgs } from 'node:util';

export interface IngestArgs {
  albums: readonly string[] | null;
  only: string | null;
  dryRun: boolean;
  bootstrapSongs: boolean;
  verbose: boolean;
}

const HELP = `Usage: pnpm ingest [options]

Options:
  --all                       Run all adapters on all albums (default).
  --albums=lover,midnights    Comma-separated subset of album slugs.
  --only=<adapterId>          Run only one adapter (e.g. musicbrainz).
  --bootstrap-songs           Create missing song rows from adapter tracklists before enrichment.
  --dry-run                   Log what would change without writing.
  --verbose                   Debug logs.
  -h, --help                  Show this help.
`;

export function parseArgs(argv: readonly string[] = process.argv.slice(2)): IngestArgs {
  const { values } = nodeParseArgs({
    args: [...argv],
    options: {
      all: { type: 'boolean', default: false },
      albums: { type: 'string' },
      only: { type: 'string' },
      'bootstrap-songs': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  const albums = values.albums
    ? values.albums
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  return {
    albums,
    only: values.only ?? null,
    dryRun: values['dry-run'] ?? false,
    bootstrapSongs: values['bootstrap-songs'] ?? false,
    verbose: values.verbose ?? false,
  };
}
