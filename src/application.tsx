import React from 'react';
import ReactDOM from 'react-dom';

import {Provider} from 'react-redux';

import {AppView} from './appview';
import store from './store';

export class Application {
    public appView: AppView;
    public store;
    public async initialize() {
        ReactDOM.render(
            <Provider store={store}>
                <AppView ref={(e) => (this.appView = e)}/>
            </Provider>,
            document.getElementById('app-container')
        );
    }
}
