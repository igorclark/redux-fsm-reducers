/*
 * modified to accommodate multiple-item states from:
 *
 * https://github.com/realb0t/redux-state-machine
 * 
 * basically provides a Redux wrapper around
 * https://github.com/jakesgordon/javascript-state-machine
 *
 * dynamically creates a new FSM/state-store per item
 * when requested in Redux actions, e.g.:
 * { type: 'ACTION_TYPE', itemName: 'my-item' }
 */

import StateMachine         from 'javascript-state-machine';
import { fill, zipObject }  from 'lodash';

const defaultInitialFsmStatus = 'INIT';

const buildStateObject = ( status, { action = null, error = null } = {} ) => {
    return { [ status ]: true, action, error, status };
}

const initStateObject = ( itemNames, createFunction ) => {
	let obj = {};
	itemNames.forEach(
		( name ) => {
			obj[ name ] = createFunction();
		}
	);
	return obj;
};

const defaultOptions = {
	logger: console,
	debug:	false,
	warn:	false
};

const multiFsmReducerBuilder = function( reducerName, itemNames, fsmConfig, initialFsmStatus = defaultInitialFsmStatus, options = {} ) {

	// set option defaults
	let mergedOptions = Object.assign( defaultOptions, options );

	const LOGGER	= mergedOptions.logger;
	const DEBUG		= mergedOptions.debug;
	const WARN		= mergedOptions.warn;

	LOGGER.info( `creating ${reducerName} multi-state-machine with initialFsmStatus ${initialFsmStatus}` );

	// work out the types of events to respond to
    const { events }		= fsmConfig;
    const eventNames		= events.map( ( event ) => { return event.name; } );

    const validTransitions	= zipObject(
        eventNames,
        fill( Array( eventNames.length ), true, 0, eventNames.length )
    );

    // create a list of state machine objects keyed by item name
    const fsms = ( () => {

        let createFunction = () => {
            return StateMachine.create(
				fsmConfig
            );
        };

        return initStateObject( itemNames, createFunction );

    } )();

    // create a default list of machine-state objects keyed by item name
    const initialState = ( () => {

        let createFunction = () => {
            return buildStateObject( initialFsmStatus );
        };

		// objects containing the state for the machine for each item
        return initStateObject( itemNames, createFunction );

    } )();

    // create reducer function, default to using the state just constructed
    const reducer = ( state = initialState, action ) => {

        // ignore events the FSM doesn't handle
        if (typeof validTransitions[ action.type ] === 'undefined') {
            return state;
        }

        if( typeof action.type === 'undefined' ) {

			// this is a dev issue, so make it visible
			if( WARN ) {
				LOGGER.warn( `${reducerName}.${action.itemName} cannot execute ${action.type} action.type, check constants` );
			}

            return {
				...state,
				[ action.itemName ]: {
					status: state[ action.itemName ].status,
					error: true,
					[ state[ action.itemName ].status ]: true,
					action
				}
			};
        }

        if( typeof action.itemName === 'undefined' ) {
            return state;
        }

        // make sure this is an item we have a state machine for
        if( typeof fsms[ action.itemName ] === 'undefined' ) {

			// this is a dev issue, so make it visible
			if( WARN ) {
				LOGGER.warn( `${reducerName} has no FSM named "${action.itemName}"` );
			}

            return state;
        }

        // make sure the state this module keeps track of includes this item
        if( typeof state[ action.itemName ] === 'undefined' ) {
            LOGGER.warn( `FSM state for item ${action.itemName} does not exist` );
            return state;
        }

		// debug info
		if( DEBUG ) {
			LOGGER.debug( `${reducerName} asked to do ${action.type} from ${state[ action.itemName ].status}` );
		}

        // keep the two in sync
        if ( fsms[ action.itemName ].current !== state[ action.itemName ].status ) {
            fsms[ action.itemName ].current = state[ action.itemName ].status;
        }

        // check the requested transition is possible
        if ( fsms[ action.itemName ].cannot( action.type ) ) {

			// this is a dev issue, so make it visible
			if( WARN ) {
				LOGGER.warn( `${reducerName}.${action.itemName} cannot do transition ${action.type} from ${state[ action.itemName ].status}` );
			}

            // set error if not
			let newStateForItem = {
				status: state[ action.itemName ].status,
				error: true,
				[ state[ action.itemName ].status ]: true,
				action
			};

			state[ action.itemName ] = newStateForItem;

			return {
				...state,
				[ action.itemName ]: newStateForItem
			};
        }

        // fire event as function
        fsms[ action.itemName ][ action.type ]( action );

		let newStateForItem = {
			status: fsms[ action.itemName ].current,
			error: null,
			[ fsms[ action.itemName ].current ]: true,
			action
		};

		let newState = {
			...state,
			[ action.itemName ]: newStateForItem
		};

		if( DEBUG ) {
			LOGGER.debug( `${reducerName} did ${action.type} on ${action.itemName}` );
			LOGGER.debug( `${reducerName}.${action.itemName} is now in state ${newState[ action.itemName ].status}` );
		}

        // return state list containing new state for this item after transition
        return newState;
    };

    return reducer;
};

export default multiFsmReducerBuilder;
