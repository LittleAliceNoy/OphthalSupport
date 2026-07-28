export type ToolType = 'checkbox' | 'radio' | 'number-input';

export interface ToolOption {
    label: string;
    value: string;
    checked?: boolean;
}

export type SurgeonGroups = Record<string, string[]>;
