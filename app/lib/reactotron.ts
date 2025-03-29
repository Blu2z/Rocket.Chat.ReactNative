import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
import sagaPlugin from 'reactotron-redux-saga';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Создаем также тип для нашего reactotron экземпляра
let reactotron: any = {};

// Инициализируем только в режиме разработки
if (__DEV__) {
  reactotron = Reactotron
    .setAsyncStorageHandler?.(AsyncStorage)
    .configure({
      name: 'Rocket.Chat'
    })
    .useReactNative?.()
    .use(reactotronRedux())
    .use(sagaPlugin({}))
    .connect();

  // Очищаем лог при запуске
  if (reactotron.clear) {
    reactotron.clear();
  }
}

export default reactotron;
