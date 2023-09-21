import {Container, Divider, render, Stack, VerticalSpace} from "@create-figma-plugin/ui";
import {on} from "@create-figma-plugin/utilities";
import {createContext, h} from "preact";
import {useEffect, useReducer} from 'preact/hooks'
import {Import, ImportExportSegmentedControl, PluginBannerWrapper} from "./components";
import {IPluginReducerAction, IPluginState, ReportErrorHandler, VariablesPreparedHandler, ReducerAction} from "./types";
import {pluginReducer} from "./reducers/plugin";
import {Export} from "./components/Export";

const initialState: IPluginState = {
    errorMsg: null,
    successMsg: null,
    importExport: 'import',
    importMode: 'ref',
    importState: 'ready',
    refToBeCreated: [],
    refToBeUpdated: [],
    sysToBeCreated: [],
    sysToBeUpdated: [],
}

export const PluginContext = createContext<IPluginState>(initialState)
export const PluginDispatchContext = createContext<(action: ReducerAction) => void>(() => {
})

const ImportExportContainer = {
    import: <Import/>,
    export: <Export/>
}

function Plugin() {
    const [state, dispatch] = useReducer<IPluginState, ReducerAction>(pluginReducer, initialState)

    useEffect(() => {
        on<ReportErrorHandler>('REPORT_ERROR', (errorMsg) => {
            dispatch({type: 'SET_ERROR_MESSAGE', errorMsg})
        });

        on<VariablesPreparedHandler>('VARIABLES_PREPARED', (data) => {
            dispatch({type: 'SET_PREPARED_DATA', data})
            dispatch({type: 'SET_IMPORT_STATE', importState: 'approve'})
        })


        on('SAVE_VARIABLES_TO_FILE', (variables) => {
            const blob = new Blob([JSON.stringify(variables)], {
                type: 'application/json'
            })

            const blobURL = URL.createObjectURL(blob)
            const link = document.createElement('a');
            const name = "variables.json"
            link.href = blobURL;
            link.download = name
            link.click()
            link.setAttribute('download', name);
        })

        on('IMPORT_FINISHED', (newVariables) => {
            console.log(newVariables)
            dispatch({type: 'SET_IMPORT_STATE', importState: 'finished'})
        })

        //emit<GetVariableCollectionsHandler>('GET_COLLECTIONS')
    }, [])

    return (
        <PluginContext.Provider value={state}>
            <PluginDispatchContext.Provider value={dispatch}>
                <Container space="medium">
                    <VerticalSpace space="small"/>
                    <Stack space="small">
                        <PluginBannerWrapper />
                        <ImportExportSegmentedControl />
                        <Divider />
                        {ImportExportContainer[state.importExport]}
                    </Stack>
                </Container>
            </PluginDispatchContext.Provider>
        </PluginContext.Provider>
    )
}

export default render(Plugin)