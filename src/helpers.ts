import {emit, EventHandler} from "@create-figma-plugin/utilities";
import {ImportMode, ImportTokensHandler} from './types'

export const getAllLocalVariables = () => {
    return figma.variables.getLocalVariables().map(item => {

        const variable = figma.variables.getVariableById(item.id)

        if (!variable) return null

        const {
            id,
            name,
            description,
            variableCollectionId,
            key,
            resolvedType,
            valuesByMode
        } = variable;

        return {
            id,
            name,
            description,
            variableCollectionId,
            key,
            resolvedType,
            valuesByMode
        }
    })
}

export const handleSelectedFiles = (files: Array<File>, importMode: ImportMode, callback: () => void) => {
    const reader = new FileReader()
    reader.readAsText(files[0])

    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            callback();
            emit<EventHandler>('IMPORT_TOKENS', {json: reader.result, importMode} as any)
        }
    }
}