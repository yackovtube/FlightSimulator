# Flight Control Tower Simulator

## Setup
To run the project install node js, mongooseDB and npm on your machine.


## Installation
Run following command in the project root directory
 
```sh
$ npm install
```

## Run

```sh
Run the mongod
$ node ./src/index.js
```


## Socket API

### Emits

**airptorUpdate** - Sends the current state of the airport
```
{
    runways: <Array<Runway>>,
    terminal: <Array<Plane>>,
    inBound: <Array<Inbound>>,
    isEmergency: <Bool<state>>
}
```

### Lisitner

**closeRunway(runwayID)** - Close runway by id
**openRunway(runwayID)** - Open runway by id
**slowSpeed** - Run in slow speed
**fastSpeed** - Run in fast speed
**AddEmerganceyLanding** - Add a plane in emergancey landing state



