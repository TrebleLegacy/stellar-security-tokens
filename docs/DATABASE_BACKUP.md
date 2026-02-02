# Database Backup & Recovery Guide

This document describes backup procedures for the Stellar Security Tokens platform.

> [!CAUTION]
> **Critical Data**: The database contains investor/company passkey credentials. Loss of this data means users lose access to their smart wallets permanently.

---

## What Gets Backed Up

| Data | Location | Critical? |
|------|----------|-----------|
| PostgreSQL database | `postgres_data` volume | ✅ Yes |
| Redis (session cache) | `redis_data` volume | No (regeneratable) |

### Critical Tables

- `companies` — Passkey credentials (`passkey_credential_id`, `passkey_public_key`)
- `investors` — Passkey credentials
- `platform_admins` — Admin accounts
- `investments` — Investment records
- `offers` — Token offering data
- `payment_logs` — Payment history

---

## Backup Procedures

### Manual Backup (Development)

```bash
# Create backup directory
mkdir -p backups

# Backup PostgreSQL
docker exec stellar_postgres pg_dump -U postgres stellar_tokens > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Compress
gzip backups/backup_*.sql
```

### Restore from Backup

```bash
# Stop backend to prevent writes during restore
docker compose stop backend

# Restore (gunzip if compressed)
gunzip -c backups/backup_20260202_120000.sql.gz | docker exec -i stellar_postgres psql -U postgres stellar_tokens

# Restart backend
docker compose start backend
```

---

## Production Backup Strategy

### Option 1: Automated Daily Backups (Cron)

```bash
# Add to crontab (crontab -e)
0 3 * * * /path/to/project/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/path/to/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup
docker exec stellar_postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Delete backups older than retention period
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: db_$TIMESTAMP.sql.gz"
```

### Option 2: Cloud Backup (Recommended for Production)

For production, consider:

1. **AWS RDS** — Automated backups, point-in-time recovery
2. **Managed PostgreSQL** (DigitalOcean, Railway, Supabase) — Built-in backups
3. **S3/GCS Upload** — Push daily backups to cloud storage

Example S3 upload addition to backup script:

```bash
# After creating backup
aws s3 cp "$BACKUP_DIR/db_$TIMESTAMP.sql.gz" s3://your-bucket/backups/
```

---

## Verification

After any restore, verify:

```bash
# Check table counts
docker exec stellar_postgres psql -U postgres stellar_tokens -c "
  SELECT 'companies' as table_name, count(*) FROM companies
  UNION ALL
  SELECT 'investors', count(*) FROM investors
  UNION ALL
  SELECT 'investments', count(*) FROM investments;
"
```

---

## Disaster Recovery Checklist

1. ✅ Daily automated backups running
2. ✅ Backups stored off-server (S3, GCS, or external storage)
3. ✅ Tested restore procedure at least once
4. ✅ Backup retention policy (30+ days recommended)
5. ✅ Monitoring/alerting if backup fails

> [!IMPORTANT]
> **Test your restore procedure** before you need it in an emergency. A backup you can't restore is useless.
