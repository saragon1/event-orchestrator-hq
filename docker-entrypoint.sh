#!/bin/sh
set -e

# Change to the HTML directory
cd /usr/share/nginx/html

# Run the environment setup script
./env.sh

# Execute the CMD
exec "$@" 