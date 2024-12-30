# SQL Scripts

This folder contains database creation and seeding scripts.

* `University.sql` - original SQL Server schema used in the initial project.
* `University_postgres.sql` - PostgreSQL‑compatible schema (use this for new
databases).
* `add.sql` - sample data insertion script for SQL Server (retained for
  reference).
* `seed_postgres.sql` - equivalent data seeding script for PostgreSQL.

Run the Postgres scripts with `psql` or your preferred database client.  The
schema uses lower‑case table names without quotes so the existing queries in
this repository continue to function without modification.
