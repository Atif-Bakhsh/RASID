#!/bin/sh
set -eu
: "${RESTORE_DATABASE_URL:?Set RESTORE_DATABASE_URL to a new empty restore database}"
if [ "$#" -ne 1 ] || [ ! -f "$1" ]; then printf '%s\n' 'Usage: sh scripts/restore.sh /absolute/path/backup.dump' >&2; exit 1; fi
rasid_restore_name=$(psql "$RESTORE_DATABASE_URL" -X -A -t -v ON_ERROR_STOP=1 -c 'SELECT current_database()')
case "$rasid_restore_name" in
  rasid_restore_*) ;;
  *) printf '%s\n' 'Restore target must be a separate database named rasid_restore_*.' >&2; exit 1 ;;
esac
rasid_restore_tables=$(psql "$RESTORE_DATABASE_URL" -X -A -t -v ON_ERROR_STOP=1 -c "SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')")
if [ "$rasid_restore_tables" != '0' ]; then printf '%s\n' 'Refusing to restore into a nonempty database.' >&2; exit 1; fi
pg_restore --dbname="$RESTORE_DATABASE_URL" --exit-on-error --single-transaction --no-owner --no-acl "$1"
printf '%s\n' "Restored into $rasid_restore_name. Verify health and reconciliation before any cutover."
