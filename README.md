# Flight Control Tower Simulator

## Setup
To run the project install node js and npm on your machine.

## Installation
Run following command in the project root directory

```sh
$ npm install
```

## Run

```sh
$ node ./src/index.js
```


## Socket API

### Emits

**airptorUpdate** - Sends the current state of the airport
```
{
    runways: <Array<Runway>>,
    terminal: <Array<Plane>>
}
```

### Lisitner

**closeRunway(runwayID)** - Close runway by id
**openRunway(runwayID)** - open runway by id
