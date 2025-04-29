#!/bin/sh
set -e

# Define the path to env-config.js
ENV_CONFIG_PATH="/usr/share/nginx/html/env-config.js"

# Create initial env-config.js if it doesn't exist
if [ ! -f "$ENV_CONFIG_PATH" ]; then
    echo 'window._env_ = {};' > "$ENV_CONFIG_PATH"
fi

# Function to add or update an environment variable
set_env_var() {
    local var_name=$1
    local var_value=$2
    
    # Escape special characters in the value
    var_value=$(echo "$var_value" | sed 's/"/\\"/g')
    
    # Check if the variable already exists
    if grep -q "$var_name" "$ENV_CONFIG_PATH"; then
        # Update existing variable
        sed -i "s|window._env_.$var_name = .*;|window._env_.$var_name = \"$var_value\";|" "$ENV_CONFIG_PATH"
    else
        # Add new variable
        echo "window._env_.$var_name = \"$var_value\";" >> "$ENV_CONFIG_PATH"
    fi
}

# Set environment variables
if [ -n "$REACT_APP_API_URL" ]; then
    set_env_var "REACT_APP_API_URL" "$REACT_APP_API_URL"
fi

if [ -n "$REACT_APP_WS_URL" ]; then
    set_env_var "REACT_APP_WS_URL" "$REACT_APP_WS_URL"
fi

if [ -n "$REACT_APP_AUTH_URL" ]; then
    set_env_var "REACT_APP_AUTH_URL" "$REACT_APP_AUTH_URL"
fi

# Ensure the file is readable by nginx
chmod 644 "$ENV_CONFIG_PATH" 