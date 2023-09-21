import {createElement, h} from "preact";
import {handleSelectedFiles} from "../helpers";
import {
    Banner,
    Bold,
    FileUploadButton,
    FileUploadDropzone,
    Muted,
    Text,
    VerticalSpace,
    LoadingIndicator,
    MiddleAlign,
    IconCheckCircle32,
    Button, Stack, Checkbox, SegmentedControl, Divider, Columns
} from "@create-figma-plugin/ui";
import {TargetedEvent, useContext, useState} from "preact/compat";
import {PluginContext, PluginDispatchContext} from "../ui";
import {PreactElement} from "preact/src/internal";
import {ImportStateComponentEnum} from "../types";
import JSX = createElement.JSX;
import {emit} from "@create-figma-plugin/utilities";

function ConfirmImport(): JSX.Element {
    const dispatch = useContext(PluginDispatchContext)
    const state = useContext(PluginContext)
    const [refUpdateState, setRefUpdateState] = useState<boolean>(false)
    const [refCreateState, setRefCreateState] = useState<boolean>(false)
    const [sysUpdateState, setSysUpdateState] = useState<boolean>(false)
    const [sysCreateState, setSysCreateState] = useState<boolean>(false)

    return (
        <Stack space="small">
            <Checkbox
                value={refCreateState}
                onChange={(event) => {
                    setRefCreateState(event.currentTarget.checked)
                }}>
                <Text>Create ref variables ({state.refToBeCreated?.length})</Text>
            </Checkbox>
            <Checkbox
                disabled={true}
                value={refUpdateState}
                onChange={(event) => {
                    setRefUpdateState(event.currentTarget.checked)
                }}>
                <Text>Update ref variables ({state.refToBeUpdated?.length})</Text>
            </Checkbox>
            <Checkbox
                disabled={true}
                value={sysCreateState}
                onChange={(event) => {
                    setSysCreateState(event.currentTarget.checked)
                }}>
                <Text>Create sys variables ({state.sysToBeCreated?.length})</Text>
            </Checkbox>
            <Checkbox
                disabled={true}
                value={sysUpdateState}
                onChange={(event) => {
                    setSysUpdateState(event.currentTarget.checked)
                }}>
                <Text>Update sys variables ({state.sysToBeUpdated?.length})</Text>
            </Checkbox>
            <VerticalSpace space="small"/>
            <Stack space="small">
                <div>
                    <Button danger fullWidth disabled={(!refCreateState &&
                        !refUpdateState &&
                        !sysCreateState &&
                        !sysUpdateState)}
                            onClick={() => {
                                dispatch({type: "SET_IMPORT_STATE", importState: 'loading'})

                                emit('EXECUTE_IMPORT', {
                                    refToBeCreated: refCreateState,
                                    refToBeUpdated: refUpdateState,
                                    sysToBeCreated: sysCreateState,
                                    sysToBeUpdated: sysUpdateState
                                })
                            }}>Approve import</Button>
                </div>
                <div>
                    <Button secondary fullWidth onClick={() => {
                        dispatch({type: "SET_IMPORT_STATE", importState: 'ready'})
                    }}>Cancel import</Button>
                </div>
            </Stack>
        </Stack>
    )
}

function FinishedImport(): JSX.Element {
    const dispatch = useContext(PluginDispatchContext)
    return (
        <Columns space="small">
            <div></div>
            <div style={{height: 240, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
                    <IconCheckCircle32 />
                    <Text>Import done</Text>
                    <VerticalSpace space="large" />
                    <Button secondary fullWidth onClick={() => {
                        dispatch({type: "SET_IMPORT_STATE", importState: 'ready'})
                    }}>Import again</Button>
            </div>
            <div></div>
        </Columns>
    )
}

const ImportEnum: ImportStateComponentEnum = {
    ready: <ReadToImport/>,
    approve: <ConfirmImport/>,
    loading: <LoadingIndicator/>,
    finished: <FinishedImport/>
}


function ReadToImport(): JSX.Element {
    const {importMode} = useContext(PluginContext)
    const dispatch = useContext(PluginDispatchContext)
    return (
        <Stack space="extraSmall">
            {/*<Banner icon={<IconInfo32/>}>This plugin only supports import of <Bold>ref</Bold> tokens</Banner>
            <Banner icon={<IconInfo32/>}>To update existing variables the tokens that are imported need to contain a
                Figma Variable ID</Banner>*/}
            {/*<SegmentedControl options={[{value: "ref", children: 'Import REF tokens'}, {
                value: "sys",
                children: 'Import SYS tokens'
            }]}
                              value={importMode}
                              onChange={(e: TargetedEvent<HTMLInputElement>) => {
                                  dispatch({
                                      type: 'SET_IMPORT_MODE',
                                      importMode: e.currentTarget.value as 'ref' | 'sys'
                                  })
                              }}/>*/}
            <FileUploadDropzone acceptedFileTypes={['application/json']} onSelectedFiles={(files) => {
                handleSelectedFiles(files, importMode, () => dispatch({
                    type: 'SET_IMPORT_STATE',
                    importState: 'finished'
                }))
            }}>
                <Text align="center">
                    <Bold>Drop token file here to import</Bold>
                </Text>
                <VerticalSpace space="small"/>
                <Text align="center">
                    <Muted>or</Muted>
                </Text>
                <VerticalSpace space="small"/>
                <FileUploadButton acceptedFileTypes={['application/json']} onSelectedFiles={(files) => {
                    dispatch({type: 'SET_IMPORT_STATE', importState: 'loading'})

                        setTimeout(() => {
                            handleSelectedFiles(files, importMode, () => dispatch({
                                type: 'SET_IMPORT_STATE',
                                importState: 'finished'
                            }))
                        }, 500)
                }}>
                    Select token file to import
                </FileUploadButton>
            </FileUploadDropzone>
        </Stack>
    )
}

export const Import = (): JSX.Element => {
    const context = useContext(PluginContext)

    if (context?.importState) return ImportEnum[context.importState]

    return ImportEnum.ready
}