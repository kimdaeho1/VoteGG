import React from 'react';
import Layers from './Layers.js';
import { Provider } from 'react-redux';
import { store } from './store.js';
import RoomList from './components/RoomList/RoomList.jsx';
import OpenviduFinal from './components/openvidu/OpenviduFinal.js';

function App() {
  return (
    <Provider store={store}>
      <Layers />
    </Provider>
  );
}

export default App;
