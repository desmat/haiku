#!/usr/bin/env bash
# redis-scan.sh
#
# Adapted by @obscurerichard from itamarhaber/scan_del.sh:
#     https://gist.github.com/itamarhaber/11126830
#
# Thanks @czerasz and @tenlee2012 for fixes
#
# Usage:
#      ./redis-scan.sh localhost 6378 0 '*test*'
#
# NOTE: if your redis-cli supports '--scan' use that instead, thanks @ferico
#
#     redis-cli --scan --pattern '*'
#

if [ "$#" -lt 2 ]
then
  echo "Scan keys in Redis matching a pattern using SCAN (safe version of KEYS)"
  echo "Usage: $0 <host> [port] [database] [pattern]"
  exit 1
fi
# host=${1:-}
# port=${2:-6379}
# database=${3:-0}
connection=${1:-\*}
pattern=${2:-\*}
cursor=-1
keys=""

echo "host=${host},port=${port},database=${database}"
while [[ "$cursor" -ne 0 ]]; do
  if [[ "$cursor" -eq -1 ]]
  then
    cursor=0
  fi

  # reply=$(redis-cli -h "$host" -p "$port" -n "$database" SCAN "$cursor" MATCH "$pattern")
  reply=$(redis-cli --tls --no-auth-warning -u "$connection" SCAN "$cursor" MATCH "$pattern" COUNT "1000")

  cursor=$(expr "$reply" : '\([0-9]*[0-9 ]\)')
  keys=${reply//$cursor/}
  # echo "keys: $keys"

  # IFS=$' - ';
  joinedKeys=${keys//\n/-}
  # echo "joinedKeys: $joinedKeys"

  if [ -n "$keys" ]; then
    keyArray=(${keys})
    # length=${#keyArray[@]}
    # echo "length: $length"
    # for (( i=0; i<length; i++ ));
    # do  
        # key="${keyArray[$i]}"
        # key=${keys[0]}
        # key="userhaiku:01dfedae:2de2e2b5 userhaiku:01ea941d:2de2e2b5"
        # echo "key: $key"

        mret=$(redis-cli --tls --no-auth-warning -u "$connection" json.mget ${keys} $.createdAt)
        # echo "mret: ${mret}" 

        retArray=(${mret})
        length=${#retArray[@]}
        # echo "length: $length"
        for (( i=0; i<length; i++ ));
        do  
          ret="${retArray[$i]}"
          createdAt=${ret//[\[\]]/}
          if [ -n "$createdAt" ]; then
            createdAtSeconds=$(($createdAt / 1000))
            createdAtDate=$(date -r $createdAtSeconds)
            echo "${keyArray[$i]} $createdAtDate" 
          fi
        done
  fi
done

