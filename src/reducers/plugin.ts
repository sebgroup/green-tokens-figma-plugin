import {IPluginState, ReducerAction} from "../types";

export function pluginReducer(state: IPluginState, action: ReducerAction): IPluginState {
    if (action.type === 'SET_IMPORT_STATE') {
        return {
            ...state,
            importState: action.importState
        }
    }
    if (action.type === 'SET_LOCAL_VARIABLES') {
        return {
            ...state,
            localVariables: action.localVariables
        }
    }
    if (action.type === 'SET_ERROR_MESSAGE') {
        return {
            ...state,
            errorMsg: action.errorMsg
        }
    }
    if (action.type === 'SET_IMPORT_MODE') {
        return {
            ...state,
            importMode: action.importMode
        }

    }
    if (action.type === 'SET_IMPORT_EXPORT') {
        if (action.importExport) {
            return {
                ...state,
                importExport: action.importExport
            }
        }

        return state
    }
    if (action.type === 'SET_PREPARED_DATA') {
        return {
            ...state,
            refToBeCreated: action.data.refToBeCreated,
            refToBeUpdated: action.data.refToBeUpdated,
            sysToBeCreated: action.data.sysToBeCreated,
            sysToBeUpdated: action.data.sysToBeUpdated
        }

    }

    return state
}