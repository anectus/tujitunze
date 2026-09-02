#!/bin/sh
# Runs once, only against a fresh (empty) Postgres data volume, via
# docker-entrypoint-initdb.d. Replays the same manual sequence the team
# already follows locally: base schema first, then every numbered
# migration in order — mirrors CLAUDE.md's description of
# database/schema/tujitunze.sql as the base state and
# database/migrations/*.sql as incremental deltas applied afterward.
set -e

SQL_DIR="/docker-entrypoint-initdb.d/database"

echo "==> Loading base schema"
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$SQL_DIR/schema/tujitunze.sql"

for f in "$SQL_DIR"/migrations/*.sql; do
  echo "==> Applying $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
done
