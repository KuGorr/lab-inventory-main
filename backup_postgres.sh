#!/bin/bash

BACKUP_DIR="/mtc/compatfolders/tools/lab-inventory-main/backups"
DATE=$(date +"%Y-%m-%d_%H-%M")
FILE="$BACKUP_DIR/lab_inventory_$DATE.sql"

docker exec lab_inventory_db pg_dump -U postgres lab_inventory > "$FILE"

echo "Backup created: $FILE"
