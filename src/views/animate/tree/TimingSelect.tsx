import React from 'react';
import ReactDOM from 'react-dom';

import {Button, IconName, MaybeElement, MenuItem, Position} from '@blueprintjs/core';
import {Select} from '@blueprintjs/select';
import {TimingMenuItem} from './TimingMenuItem';
import CustomIcon from '../../common/CustomIcon';
import {getHumanReadableFieldInfo} from '../../../data/data_utils';

export interface TimingOption {
    title: string;
    description: string;
    type: 'all' | 'stagger' | 'speed';
    previewImage: string;
    iconImages: string[];
    dataOptions: AttributeOption[];
    visualOptions: AttributeOption[];
}

export interface AttributeOption {
    field: string;
    min: any;
    max: any;
    unique: any;
    type: 'string' | 'numerical' | 'date' | 'boolean' | 'integer';
}

const TimingOptionSelect = Select.ofType<TimingOption>();

export interface TimingSelectProps {
    items: TimingOption[];
    icon: MaybeElement;
    selectedType: 'all' | 'stagger' | 'speed';
    onItemSelect: (type: string, field: string) => void;
}

export class TimingSelect extends React.Component<TimingSelectProps, {}> {
    constructor(props) {
        super(props);
    }

    public render() {
        const text = TEXT_DISPLAY[this.props.selectedType];
        return (
            <TimingOptionSelect
                filterable={false}
                items={this.props.items}
                itemRenderer={this._renderTimingOption}
                onItemSelect={this._handleValueChange}
                popoverProps={{minimal: true, position: Position.BOTTOM}}
            >
                <Button
                    icon={this.props.icon}
                    rightIcon="caret-down"
                    minimal={true}
                    outlined={true}
                    text={text}
                />
            </TimingOptionSelect>
        );
    }

    private _handleValueChange = (selected: TimingOption, event) => {
        let field = event.currentTarget.getAttribute('data-field');
        this.props.onItemSelect(selected.type, field);
    };

    private _renderTimingOption = (t: TimingOption, {handleClick}) => {
        const options =
            t.dataOptions.length > 0
                ? t.dataOptions.map((o) => {
                      return (
                          <MenuItem
                              style={{fontSize: '0.9em'}}
                              icon={CustomIcon[o.type.toUpperCase()]}
                              text={`${o.field} (${getHumanReadableFieldInfo(o)})`}
                              data-field={o.field}
                              onClick={handleClick}
                          />
                      );
                  })
                : undefined;
        return (
            <TimingMenuItem
                text={t.title}
                description={t.description}
                id={t.type}
                previewImage={t.previewImage}
                iconImages={t.iconImages}
                onClick={t.dataOptions.length > 0 ? undefined : handleClick}
            >
                {options}
            </TimingMenuItem>
        );
    };
}

const TEXT_DISPLAY = {all: 'All at once', stagger: 'Stagger by', speed: 'Speed by'};
