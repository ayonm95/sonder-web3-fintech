#!/usr/bin/env bash
set -e

# PostgreSQL Multi-Database Initialization Script
# Provisions separate logical databases and isolated service users for each microservice.

create_user_and_database() {
	local database=$1
	local user=$2
	local password=$3
	echo "Creating database '$database' and user '$user'..."
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	    CREATE USER $user WITH PASSWORD '$password';
	    CREATE DATABASE $database OWNER $user;
	    GRANT ALL PRIVILEGES ON DATABASE $database TO $user;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db_spec in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
		# format: db_name:user:password
		IFS=':' read -r db user password <<< "$db_spec"
		create_user_and_database "$db" "$user" "${password:-secret}"
	done
	echo "All isolated microservice databases and credentials provisioned."
fi
