# Deployment Considerations
Background Information:
* Require two servers to run instances of the web app and Elasticsearch
* High security requirement with a user account system (potentially linked with ANU ISIS accounts)
* Scaling availability (hence Elasticsearch in a separate cluster/server)
* Assumption of 10,000 hits/day at most (number based on undergrad students)
* 2 GB RAM hardware requirement for Elasticsearch (under specifications according to official doc, but most likely sufficient for the traffic expected for the time being)
* Virtual private server with a free trial to host website/elasticsearch required (microgrant available but disfavorable)
* Australia-based server for fast response times

# Research findings (summary)
## Amazon Web Services
* Free tier available for 750 hours/month of a *single* EC2 instance (t2.micro ~ 1GB RAM)
* Elastic Beanstalk and Amazon Elasticsearch Service available for relatively easy deployment (note: this option was test-deployed. Setting up the instances will still be time consuming for people inexperienced with Elasticsearch or Django)
* Free tier only offers t2.micro instances which are heavily under specifications for Elasticsearch
* Sydney based server available

## Microsoft Azure
* $200 Azure credits for 30 day period
* Access to certain products for 12 months (includes 750 hours of some VMS, storage etc.)
* Cheaper than AWS and Google Cloud for the required hardware specs
* Sydney based server available

## Google Cloud
* $300 free for 12 months, along with free usage limits for certain products
* Sydney based server available

## Vultr
* Cheapest VPS provider with $10/month for 2 GB RAM virtual machine
* No free trial
* Sydney based server available

# Decisions
* All options considered provide continuous integration tools
* All options have servers located in Sydney
* AWS disregarded despite possibly having the easiest set-up: hardware and free-tier too restrictive, drawbacks in scalability and customisation 
* Vultr cheapest but does not offer a free trial, and therefore disregarded
* Azure appears to offer cheapest products that meet the requirements, but 30 day period for spending means all members of the team will have to use their free trial until a microgrant is available
* GC offers the most in terms of free trials and customisation, and therefore chosen for final deployment VPS provider


