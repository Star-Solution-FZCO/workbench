import argparse
import os
import re
import sys
from os.path import join as opj, realpath
from typing import LiteralString

DICT_PATH = os.getenv('BANNED_WORDS_DICT')


def process_file(file_path: LiteralString | str | bytes, pattern: re.Pattern) -> bool:
    try:
        with open(file_path, 'r') as file:
            for line in file:
                if pattern.search(line):
                    return False
    except (UnicodeDecodeError, FileNotFoundError):
        pass
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description='Check if banned words are present in the files')
    parser.add_argument('--source', type=str, default='.', help='Path to the source code')
    args = parser.parse_args()

    if not DICT_PATH:
        print('Dictionary path is not set, skipping check')
        return 0

    if not os.path.exists(DICT_PATH):
        print(f'File {DICT_PATH} does not exist')
        return 2

    with open(DICT_PATH, 'r') as file:
        banned_words = [line.strip() for line in file if line.strip()]
        if not banned_words:
            return 0
        banned_pattern = re.compile('|'.join(banned_words), flags=re.IGNORECASE)

    return_code = 0
    for root, _, files in os.walk(args.source):
        for file in files:
            full_path = opj(root, file)
            if realpath(full_path) == realpath(DICT_PATH):
                continue
            if not process_file(opj(root, file), banned_pattern):
                print(f'{opj(root, file)} check failed')
                return_code = 1
    return return_code


if __name__ == '__main__':
    sys.exit(main())
