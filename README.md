### Redux FSM Reducers

Tools to embed [javascript-state-machine](https://github.com/jakesgordon/javascript-state-machine) FSMs as [redux](https://github.com/reactjs/redux) reducers.  

Modified & extended from [redux-state-machine](https://github.com/realb0t/redux-state-machine/blob/master/LICENSE) to allow multiple-FSM reducers, with FSMs keyed by a list of names provided to the reducer-builder function. Provides some simple utils for use in [redux-saga](https://github.com/redux-saga/redux-saga)s.

Depends on:

* [arrify](https://www.npmjs.com/package/arrify)
* [javascript-state-machine](https://www.npmjs.com/package/javascript-state-machine)
* [lodash](https://www.npmjs.com/~jdalton)
* [redux-saga](https://www.npmjs.com/package/redux-saga)
