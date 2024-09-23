import { dateUtil } from '@epdoc/timeutil';
import { Dict, isArray, isDate, isDict } from '@epdoc/typeutil';
import { LogLevelValue } from '../level';

// export type StyleName = string;
export type StyleDef = Dict;

export const defaultStyles = {
    text: {},
    h1: {},
    h2: {},
    h3: {},
    action: {},
    label: {},
    highlight: {},
    value: {},
    path: {},
    date: {},
    warn: {},
    error: {},
    strikethru: {},
    _reqId: {},
    _sid: {},
    _emitter: {},
    _action: {},
    _plain: {},
    _suffix: {},
    _elapsed: {},
    _errorPrefix: {},
    _warnPrefix: {},
    _infoPrefix: {},
    _verbosePrefix: {},
    _debugPrefix: {},
    _sillyPrefix: {},
    _httpPrefix: {},
    _timePrefix: {}
} as const;

export type StyleName = keyof typeof defaultStyles;
export type MethodName = Exclude<keyof typeof defaultStyles, `_${string}`>;

export type StyleOptions = {
    dateFormat?: string;
    styles?: Record<string, StyleDef>;
};

export class Style {
    public readonly _styles: Record<string, StyleDef>;
    protected _dateFormat: string;

    constructor(options: StyleOptions = { dateFormat: 'YYYY-MM-dd HH:mm:ss' }) {
        this._dateFormat = options.dateFormat;
        this._styles = Object.assign({}, options.styles ? options.styles : defaultStyles);
    }

    get styles(): StyleName[] {
        return Object.keys(defaultStyles) as StyleName[];
    }

    format(val: any, style?: StyleName | any): string {
        if (isDict(val) || isArray(val)) {
            return JSON.stringify(val);
        } else if (isDate(val)) {
            return dateUtil(val).format(this._dateFormat);
        }
        return String(val);
    }

    getLevelStyleName(level: LogLevelValue): StyleName {
        return null;
    }
}
