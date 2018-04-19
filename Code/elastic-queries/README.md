## Configuring elastic-search indices

* Download elasticsearch from https://www.elastic.co/downloads/elasticsearch. Ensure that it is version 6.2.3.
* Follow the first three steps on that page
* If the repository isn't up to date, do a `git pull`.
* In your terminal, in the root directory for the project, run `cd Code/elastic-queries`.
* Run the following command `curl -s -H "Content-Type: application/x-ndjson" -XPOST localhost:9200/_bulk --data-binary "@course_bulk"; echo`. This populates an index named "Courses" with the ANU Courses data that was scraped. You might notice a few errors in this step, ignore those for now.
