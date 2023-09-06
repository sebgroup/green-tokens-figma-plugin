import {
    render,
    Container,
    VerticalSpace,
    Stack,
    Text,
    Bold,
    SegmentedControl,
    Banner,
    IconWarning32,
    IconCheckCircle32
} from "@create-figma-plugin/ui";
import {on} from "@create-figma-plugin/utilities";
import {h, createContext, FunctionComponent} from "preact";
import {useReducer, useEffect} from 'preact/hooks'
import {TargetedEvent} from "preact/compat";
import {FileUpload} from "./components/FileUpload";
import {IPluginState, ReportErrorHandler, IPluginReducerAction} from "./types";
import styles from './styles.css'

const initialState: IPluginState = {
    errorMsg: null,
    successMsg: null,
    importMode: 'new',
    importState: 'ready'
}

export const PluginContext = createContext<IPluginState>(initialState)
export const PluginDispatchContext = createContext<(action: Partial<IPluginReducerAction>) => void>(() => {})

function pluginUiReducer(state: IPluginState, action: Partial<IPluginReducerAction>): IPluginState {
    if (action.type === 'START_LOAD_FILE') {
        return {
            ...state,
            importState: 'loading'
        }
    }
    if (action.type === 'FINISHED_LOAD_FILE') {
        return {
            ...state,
            importState: 'finished'
        }
    }
    if (action.type === 'RESET_LOAD_FILE') {
        return {
            ...state,
            importState: 'ready'
        }
    }
    if (action.type === 'SET_ERROR_MESSAGE') {
        return {
            ...state,
            errorMsg: action.errorMsg
        }
    }
    if (action.type === 'SET_IMPORT_MODE') {
        if (action.importMode) {
            return {
                ...state,
                importMode: action.importMode
            }
        }

        return state
    }

    return state
}

function Plugin() {
    const [state, dispatch] = useReducer<IPluginState, Partial<IPluginReducerAction>>(pluginUiReducer, initialState)

    useEffect(() => {
        on<ReportErrorHandler>('REPORT_ERROR', (errorMsg) => {
            dispatch({type: 'SET_ERROR_MESSAGE', errorMsg})
            dispatch({type: 'RESET_LOAD_FILE'})
        });

        //emit<GetVariableCollectionsHandler>('GET_COLLECTIONS')
    }, [])

    return (
        <PluginContext.Provider value={state}>
            <PluginDispatchContext.Provider value={dispatch}>
                <Container space="medium">
                    <VerticalSpace space="small"/>
                    <Stack space="small">
                        {state.successMsg && <Banner icon={<IconCheckCircle32 />} variant="success">{state.successMsg}</Banner>}
                        {state.errorMsg && <Banner icon={<IconWarning32 />} variant="warning">{state.errorMsg}</Banner>}
                        <Stack space="extraSmall">
                            <Text><Bold>Import mode</Bold></Text>
                            {state.importMode && (
                                <SegmentedControl options={[{value: "new", children: 'Add tokens'}, {
                                    value: "replace",
                                    children: 'Update tokens'
                                }]}
                                                  value={state.importMode}
                                                  onChange={(e: TargetedEvent<HTMLInputElement>) => {
                                                      dispatch({type: 'SET_IMPORT_MODE', importMode: e.currentTarget.value as 'new' | 'replace'})
                                                  }}/>
                            )}
                        </Stack>
                        <FileUpload/>
                    </Stack>
                </Container>
            </PluginDispatchContext.Provider>
        </PluginContext.Provider>
    )
}
export default render(Plugin)