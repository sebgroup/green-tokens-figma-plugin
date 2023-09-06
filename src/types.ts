import {EventHandler} from '@create-figma-plugin/utilities'
import {JSX} from "preact";

export type ImportMode = 'new' | 'replace'

export interface ImportStateComponentEnum {
    ready: JSX.Element
    loading: JSX.Element
    finished: JSX.Element
}

export type ImportState = keyof ImportStateComponentEnum;

export interface IPluginState {
    errorMsg?: string | null
    successMsg?: string | null
    importMode: ImportMode
    importState: ImportState
}

export interface IPluginReducerAction extends IPluginState {
    type: string
}

export interface ImportTokensHandler extends EventHandler {
    name: 'IMPORT_TOKENS'
    handler: (json: string, importMode: string) => void
}

export interface ReportErrorHandler extends EventHandler {
    name: 'REPORT_ERROR'
    handler: (msg: string) => void
}

export interface Token {
    value?: string,
    darkValue?: string
    filePath?: string
    isSource?: boolean
    original?: {
        value: string
    },
    name?: string
    attributes?: {
        [key: string]: string
    }
    path?: string[]
}

export interface Variable {

}

export interface TokensCategory {
    [property: string]: TokensCategory | Token
}

export interface Tokens {
    ref: TokensCategory,
    sys: TokensCategory
}