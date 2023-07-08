import React from 'react';
import ReactDOM from 'react-dom';

export default class DefsElement extends React.Component<{}, {}> {
    public render() {
        return (
            <defs>
                <linearGradient id="layer-enter-gradient">
                    <stop offset="0%" className="stop-0"/>
                    <stop offset="100%" className="stop-1"/>
                </linearGradient>
                <linearGradient id="layer-exit-gradient">
                    <stop offset="0%" className="stop-0"/>
                    <stop offset="100%" className="stop-1"/>
                </linearGradient>
            </defs>
        );
    }
}
