import { select }   from 'redux-saga/effects';

import arrify       from 'arrify';

const fsmIsCurrentlyInState = function* ( reducerName, itemName, desiredState ) {

    let itemState = yield select( ( state ) => { return state[ reducerName ]; } );

    if( typeof itemState[ itemName ] === 'undefined' ) {
        return false;
    }

    let statesToCheck   = arrify( desiredState );
    let currentState    = itemState[ itemName ].status;

    for( let state of statesToCheck ) {
        if( state === currentState ) {
            return true;
        }
    }

    return false;

};

export default {
	fsmIsCurrentlyInState
};
