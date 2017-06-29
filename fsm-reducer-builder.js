/*
 * modified slightly from the version at
 * https://raw.githubusercontent.com/realb0t/redux-state-machine/master/src/reducer.js
 *
 * takes reducerName, optional initialFsmStatus & logger arguments,
 * and hides the FSM & validTransitions ('existEvent') objects from outsiders
 */
import StateMachine from 'javascript-state-machine';
import { fill, zipObject }	from 'lodash';

const defaultInitialFsmStatus = 'INIT';

/**
 * Return new state object with status param
 * @param	{String} status status name param
 * @param	{Object} { action, error } addition params
 * @return {Object} new state object
 */
const buildStateObject = ( status, { action = null, error = null } = {} ) => {
	return {
		[status]: true,
		action,
		error,
		status
	};
};

const defaultOptions = {
	logger: console,
	debug:	false,
	warn:	false
};

/**
 * @param {Object} fsmConfig - Config as for javascript-state-machine
 */
const fsmReducerBuilder = ( reducerName, fsmConfig, initialFsmStatus = defaultInitialFsmStatus, options = {} ) => {

	// set option defaults
	let mergedOptions = Object.assign( defaultOptions, options );

	const LOGGER	= mergedOptions.logger;
	const DEBUG		= mergedOptions.debug;
	const WARN		= mergedOptions.warn;

	LOGGER.info( `creating ${reducerName} state-machine with initialFsmStatus ${initialFsmStatus}` );

	// work out the types of events to respond to
	const { events }		= fsmConfig;
	const eventNames		= events.map( ( event ) => { return event.name; } );

	const validTransitions	= zipObject(
		eventNames,
		fill( Array( eventNames.length ), true, 0, eventNames.length )
	);

	// create the state machine
	const fsm			= StateMachine.create( fsmConfig );

	// create a default state for the machine
	const initialState	= buildStateObject( initialFsmStatus );

	// create reducer function, using initial state just constructed
	const reducer = ( state = initialState, action ) => {

		// ignore events the FSM doesn't handle
		if( typeof validTransitions[ action.type ] === 'undefined' ) {
			return state;
		}

		if( typeof action.type === 'undefined' ) {

			// this is a dev issue, so make it visible
			if( WARN ) {
				LOGGER.warn( `${reducerName} cannot execute ${action.type} action.type, check constants` );
			}

			return state;
		};

		// debug info
		if( DEBUG ) {
			LOGGER.debug( `${reducerName} asked to do ${action.type} from ${state.status}` );
		}

		// keep the FSM in sync with the current state
		if( fsm.current !== state.status ) {
			fsm.current = state.status;
		}

		// check transition is possible
		if( fsm.cannot( action.type ) ) {

			if( WARN ) {
				LOGGER.warn( `${reducerName} cannot do ${action.type} from ${state.status}` );
			}

			// set error if transition imposible
			return {
				status: state.status,
				error: true,
				[ state.status ]: true,
				action
			};
		}

		// fire event as FSM function
		fsm[ action.type ]( action );

		if( DEBUG ) {
			LOGGER.debug( `${reducerName} did transition ${action.type} and is now in state ${fsm.current}` );
		}

		// Return next state after transition
		return {
			status: fsm.current,
			error: null,
			[ fsm.current ]: true,
			action
		};
	};

	return reducer;
};

export default fsmReducerBuilder;
