## Setup & Install

To setup test environment run

```
npm install
```

## Deploy

Install parse commandline

```
curl -s https://www.parse.com/downloads/cloud_code/installer.sh | sudo /bin/bash
```

To deploy code to parse.com run

```
parse deploy
```

## Styleguide

- Commit: https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines
- CodeStyle: https://github.com/rwaldron/idiomatic.js


# Folder structure

TBD

# Testing

TBD

# High-level design

put link here

# Data structure

## Entities

TBD


## Data Tables

### UserChallenges
Table contains records of challenges accepted by users

# Cloud hosting

Base url:  http://myhealth.parseapp.com

# Cloud points

- *fetchDataFromAlgorithm* -- if assessment for current user is complete, then it sends required data to weight loss algorithm
- *getChallenges* -- returns challenges for current user grouped by focus groups
- *getChallengesCompletionRateOverPeriod* -- returns challenges completion rate over 2 week periods


# DB Changelog

## 20-03-2015
- Added user field to UserChallenges table
- Added completedAt field to UserChallenges table
- Deprecated userId field at UserChallenges table

