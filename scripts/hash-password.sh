#!/usr/bin/env bash
set -euo pipefail

read -r -s -p "Admin password: " ADMIN_PASSWORD_INPUT
printf '\n' >&2

ADMIN_PASSWORD_HASH_VALUE=$(printf '%s' "$ADMIN_PASSWORD_INPUT" | node -e 'let p="";process.stdin.setEncoding("utf8");process.stdin.on("data",v=>p+=v);process.stdin.on("end",()=>require("bcryptjs").hash(p,12).then(v=>process.stdout.write(v)));')
unset ADMIN_PASSWORD_INPUT

# Next.js expands dollar signs in .env values, so escape them in the assignment.
printf 'ADMIN_PASSWORD_HASH='
printf '%s' "$ADMIN_PASSWORD_HASH_VALUE" | sed 's/[$]/\\$/g'
unset ADMIN_PASSWORD_HASH_VALUE
