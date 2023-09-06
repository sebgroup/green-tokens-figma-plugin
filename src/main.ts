import {emit, on, showUI} from '@create-figma-plugin/utilities'
import {VALID_COLLECTIONS_NAMES} from './constants'
import {ReportErrorHandler, Token, Tokens, TokensCategory, Variable} from './types'
import {useContext} from "preact/compat";
import {PluginContext} from "./ui";

const {getLocalVariableCollections, getVariableCollectionById, getLocalVariables} = figma.variables

function flattenTokens(obj: Token | Tokens | TokensCategory, target: Variable[]) {
    for (const entry in Object.entries(obj)) {
        if(entry[1].hasOwnProperty('value')) {
            target.push(entry[1])
        } else {
            if( typeof entry[1] === 'object') {
                flattenTokens(entry[1], target)
            }
        }
    }
}

function convertTokensToVariables(tokens: Tokens) {
    const refVariables: Variable[] = []
    const sysVariables: Variable[] = []
    flattenTokens(tokens.ref, refVariables)
    flattenTokens(tokens.sys, sysVariables)

    return {
        ref: refVariables,
        sys: sysVariables
    }
}

function checkValidCollections() {
    console.log('checkValidCollections')
    const context = useContext(PluginContext)
    console.log(context)
    const localCollections = getLocalVariableCollections()
    localCollections.forEach(collection => {
        const { name } = collection
        if (VALID_COLLECTIONS_NAMES.includes(name)) return
        emit<ReportErrorHandler>('REPORT_ERROR', `Your Figma file must contain two collections named: ${VALID_COLLECTIONS_NAMES.join(', ')}`)
    })
}

export default () => {
    console.log('INIT ENNN')
    //checkValidCollections()

    on('IMPORT_TOKENS', async ({json, importMode}) => {
            const tokens: Tokens = JSON.parse(json) as { ref: any, sys: any }

            if (!tokens.ref) {
                emit<ReportErrorHandler>('REPORT_ERROR', 'Your JSON file must contain ref tokens')
            }

            const variables = convertTokensToVariables(tokens)

            console.log(variables)
            console.log(getLocalVariables())

        }
    )

    showUI({height: 300, width: 320})
}
