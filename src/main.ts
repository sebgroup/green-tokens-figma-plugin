import {emit, on, showUI} from '@create-figma-plugin/utilities'
import {VALID_COLLECTIONS_NAMES} from './constants'
import {
    VariablesPreparedHandler,
    ReportErrorHandler,
    Token,
    Tokens,
    TokensCategory,
} from './types'
import {InterimVariable} from "./classes/InterimVariable";

const {getLocalVariableCollections, getLocalVariables} = figma.variables

function flattenTokens(obj: Token | Tokens | TokensCategory, target: Token[]) {
    for (const entry of Object.entries(obj)) {
        if (entry[1].hasOwnProperty('value')) {
            target.push(entry[1])
        } else {
            if (typeof entry[1] === 'object') {
                flattenTokens(entry[1], target)
            }
        }
    }
}



function checkValidCollections() {
    const localCollections = getLocalVariableCollections()
    localCollections.forEach(collection => {
        const {name} = collection
        if (VALID_COLLECTIONS_NAMES.includes(name)) return
        emit<ReportErrorHandler>('REPORT_ERROR', `Your Figma file must contain two variable collections named: ${VALID_COLLECTIONS_NAMES.join(', ')} in order for this plugin to work.` as any)
    })
}

export default () => {
    console.log('INIT')

    let refVariables: InterimVariable[];
    let sysVariables: InterimVariable[];

    on('IMPORT_TOKENS', async ({json}) => {
            const tokens: Tokens = JSON.parse(json) as { ref: any, sys: any }

            if (!tokens.ref) {
                emit<ReportErrorHandler>('REPORT_ERROR', 'Your JSON file must contain ref tokens' as any)
            }

            const flatTokensMap: Token[] = []

            flattenTokens(tokens, flatTokensMap)

            const interimVariables = flatTokensMap.map(token => new InterimVariable(token))//convertTokensToVariables(flatTokensMap)

            refVariables = interimVariables.filter(item => !item.alias)
            sysVariables = interimVariables.filter(item => item.alias)

            emit<VariablesPreparedHandler>('VARIABLES_PREPARED', {
                refToBeCreated: refVariables.filter(item => !item.existingFigmaVariable),
                refToBeUpdated: refVariables.filter(item => !!item.existingFigmaVariable),
                sysToBeCreated: sysVariables.filter(item => !item.existingFigmaVariable),
                sysToBeUpdated: sysVariables.filter(item => !!item.existingFigmaVariable)
            } as any)

        }
    )

    on('EXECUTE_IMPORT', ({
                              refToBeCreated,
                              refToBeUpdated,
                              sysToBeCreated,
                              sysToBeUpdated
                          }: {
        refToBeCreated: boolean
        refToBeUpdated: boolean
        sysToBeCreated: boolean
        sysToBeUpdated: boolean
    }) => {

        console.log(refVariables)

        if (refToBeCreated) {
            refVariables.filter(item => !item.existingFigmaVariable).forEach(variable => variable.createFigmaVariable())
        }

        if (refToBeUpdated) {
            refVariables.filter(item => !!item.existingFigmaVariable).forEach(variable => variable.createFigmaVariable())
        }

        if (sysToBeCreated) {
            sysVariables.filter(item => !item.existingFigmaVariable).forEach(variable => variable.createFigmaVariable())
        }

        if (sysToBeUpdated) {
            sysVariables.filter(item => !!item.existingFigmaVariable).forEach(variable => variable.createFigmaVariable())
        }

        refVariables = []
        sysVariables = []

        emit('IMPORT_FINISHED')
    })

    on('EXPORT_VARIABLES', () => {
        const collections = getLocalVariableCollections().map(item => ({
            id: item.id,
            name: item.name,
            modes: item.modes,
            defaultModeId: item.defaultModeId
        }))

        const variables = getLocalVariables().map(item => ({
            name: item.name,
            id: item.id,
            variableCollection: collections.find(collection => collection.id === item.variableCollectionId),
            description: item.description,
            valuesByMode: item.valuesByMode,
            resolvedType: item.resolvedType
        }))

        emit('SAVE_VARIABLES_TO_FILE', variables as any);
    })

    showUI({height: 400, width: 320})

    checkValidCollections()

    console.log(figma);
}
