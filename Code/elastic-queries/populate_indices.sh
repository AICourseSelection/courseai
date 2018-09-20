#!/bin/bash
# usage: populate_indices.sh <host address>

if [ $# -eq 0 ]
  then
    echo "ERROR: No host address provided (e.g. localhost)"
    echo "usage: populate_indices.sh <host address>"
    exit 1
fi 

curl -X DELETE "$1:9200/cbelists"
curl -X DELETE "$1:9200/courseupdated"

declare -a BULKS=("@degree_bulk" "@major_bulk" "@minor_bulk" "@specialisations_bulk"  "@courselists_bulk" "@cse_bulk" "@course_updated_bulk")

for bulk in "${BULKS[@]}"
do
    curl -s -H "Content-Type: application/x-ndjson" -XPOST $1:9200/_bulk --data-binary $bulk; echo 
done
