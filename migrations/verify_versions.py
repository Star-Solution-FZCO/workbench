import argparse
import os
import re
import sys
from dataclasses import dataclass
from os.path import dirname as opd
from os.path import join as opj


def _print_verbose(message: str, verbose: bool) -> None:
    if verbose:
        print(message)


REVISION_PATTERN = re.compile(r'^revision = (\'|")([a-z0-9]+)(\'|")$')
DOWN_REVISION_PATTERN = re.compile(r'^down_revision = (\'|")([a-z0-9]+)(\'|")')


@dataclass
class Migration:
    revision: str
    down_revision: str | None


def parse_file(file: str) -> Migration:
    with open(file, 'r') as f:
        lines = f.readlines()
    revision = down_revision = None
    for line in lines:
        if match := REVISION_PATTERN.match(line):
            revision = match.group(2)
        elif match := DOWN_REVISION_PATTERN.match(line):
            down_revision = match.group(2)
    if not revision:
        raise ValueError(f'No revision found in {file}')
    return Migration(revision=revision, down_revision=down_revision)


def verify_versions(migrations_dir: str, verbose: bool) -> None:
    migrations = {}
    first = None
    for file in os.listdir(migrations_dir):
        if not file.endswith('.py'):
            _print_verbose(f'Skipping {file}', verbose)
            continue
        m = parse_file(opj(migrations_dir, file))
        if not m.down_revision:
            if first:
                raise ValueError(f'First migration already found: {first}, but {m.revision} has no down_revision')
            first = m.revision
        else:
            if m.down_revision in migrations:
                raise ValueError(f'{m.down_revision} found as down migration for {migrations[m.down_revision]} and {m.revision}')
            migrations[m.down_revision] = m.revision
    if not first:
        raise ValueError('No first migration found')
    curr = first
    while migrations:
        if curr not in migrations:
            raise ValueError(f'{curr} should be the last migration, but {len(migrations)} left ({migrations.keys()})')
        curr = migrations.pop(curr)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--dir',
        type=str,
        default=opj(opd(__file__), 'versions'),
        help='migrations directory path',
    )
    parser.add_argument('--verbose', '-v', action='store_true', help='verbose mode')
    args = parser.parse_args()
    try:
        verify_versions(args.dir, True)
    except ValueError as err:
        print(err)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
