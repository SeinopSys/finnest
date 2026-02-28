#!/bin/bash

# Source - https://stackoverflow.com/a/79880527
# Posted by Naruto Uzumaki
# Retrieved 2026-02-28, License - CC BY-SA 4.0

set -e
set -u

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
    echo ">> Creating multiple DBs: $POSTGRES_MULTIPLE_DATABASES"

    for db in ${POSTGRES_MULTIPLE_DATABASES//,/ }; do
        echo ">>  Creating DB '$db'"
        createdb --username "$POSTGRES_USER" "$db"
    done

    echo ">> Multiple DBs created"
fi
