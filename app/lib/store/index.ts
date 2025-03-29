import { applyMiddleware, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../../reducers';
import sagas from '../../sagas';
import applyAppStateMiddleware from './appStateMiddleware';
import applyInternetStateMiddleware from './internetStateMiddleware';

// Импортируем настроенный Reactotron
import reactotron from '../reactotron';

let sagaMiddleware;
let enhancers;

if (__DEV__) {
	const reduxImmutableStateInvariant = require('redux-immutable-state-invariant').default();
	
	// Используем настроенный reactotron с saga плагином
	sagaMiddleware = createSagaMiddleware({
		context: {}, // добавляем context для saga
		sagaMonitor: reactotron.createSagaMonitor?.()
	});

	enhancers = compose(
		applyAppStateMiddleware(),
		applyInternetStateMiddleware(),
		applyMiddleware(reduxImmutableStateInvariant),
		applyMiddleware(sagaMiddleware),
		reactotron.createEnhancer?.()
	);
} else {
	sagaMiddleware = createSagaMiddleware();
	enhancers = compose(applyAppStateMiddleware(), applyInternetStateMiddleware(), applyMiddleware(sagaMiddleware));
}

const store = createStore(reducers, enhancers);
sagaMiddleware.run(sagas);

export default store;
