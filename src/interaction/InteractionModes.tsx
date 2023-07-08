import React from 'react';

import { MenuItem } from '@blueprintjs/core';

import {IconName} from '@blueprintjs/icons';

export interface IInteractionMode {
    title: string;
    id: string;
    icon: IconName;
}

export const ITEMS: IInteractionMode[] = [
    { title: 'Slides', id: 'slides', icon: 'presentation'},
    { title: 'Steppers', id: 'steppers', icon: 'widget-button'},
    { title: 'Video', id: 'video', icon: 'mobile-video'}
];

export const renderInteractionMode = (interactionMode, { handleClick, modifiers }) => {
    return (
        <MenuItem
            active={modifiers.active}
            disabled={modifiers.disabled}
            key={interactionMode.id}
            onClick={handleClick}
            text={interactionMode.title}
            icon={interactionMode.icon}
            />
    );
};

