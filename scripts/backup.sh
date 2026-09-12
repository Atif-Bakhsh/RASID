#!/bin/sh
set -eu
: "${DATABASE_URL:?Set DATABASE_URL for the database to back up}"
if [ "$#" -ne 1 ]; then printf '%s\n' 'Usage: sh scripts/backup.sh /absolute/path/new-backup.dump' >&2; exit 1; fi
if [ -e "$1" ]; then printf '%s\n' 'Refusing to overwrite an existing backup.' >&2; exit 1; fi
umask 077
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-acl --file="$1"
pg_restore --list "$1" >/dev/null
printf '%s\n' "Backup verified: $1"
