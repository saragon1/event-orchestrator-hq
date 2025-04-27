#!/bin/sh

# Recreate config file
rm -rf ./env-config.js
touch ./env-config.js

# Add assignment 
echo "window._env_ = {" >> ./env-config.js

# Read each line in .env file
# Each line represents key=value pairs
if [ -f .env ]; then
  while read -r line || [ -n "$line" ];
  do
    # Split env variables by character `=`
    if printf '%s\n' "$line" | grep -q -e '='; then
      varname=$(printf '%s\n' "$line" | sed -e 's/=.*//')
      varvalue=$(printf '%s\n' "$line" | sed -e 's/^[^=]*=//')
    fi

    # Read value of current variable if exists as Environment variable
    value=$(printf '%s\n' "${!varname}")
    # Otherwise use value from .env file
    [ -z "$value" ] && value=${varvalue}
    
    # Append configuration property to JS file
    echo "  $varname: \"$value\"," >> ./env-config.js
  done < .env
fi

# Also add all environment variables starting with REACT_APP_
for envvar in $(env | grep -E "^REACT_APP_" | sort); do
  varname=$(printf '%s\n' "$envvar" | sed -e 's/=.*//')
  varvalue=$(printf '%s\n' "${!varname}")
  
  echo "  $varname: \"$varvalue\"," >> ./env-config.js
done

# Also add VITE_ environment variables at runtime
for envvar in $(env | grep -E "^VITE_" | sort); do
  varname=$(printf '%s\n' "$envvar" | sed -e 's/=.*//')
  varvalue=$(printf '%s\n' "${!varname}")
  
  echo "  $varname: \"$varvalue\"," >> ./env-config.js
done

echo "}" >> ./env-config.js 