import {createElement, h} from "preact";
import {handleSelectedFiles} from "../helpers";
import {
    Bold,
    FileUploadButton,
    FileUploadDropzone,
    Muted,
    Text,
    VerticalSpace,
    LoadingIndicator
} from "@create-figma-plugin/ui";
import {useContext} from "preact/compat";
import {PluginContext, PluginDispatchContext} from "../ui";
import {PreactElement} from "preact/src/internal";
import {ImportStateComponentEnum} from "../types";
import JSX = createElement.JSX;



const ComponentEnum: ImportStateComponentEnum = {
    ready: <DropZone/>,
    loading: <LoadingIndicator/>,
    finished: <div>Ready!</div>
}

function DropZone(): JSX.Element {
    const {importMode} = useContext(PluginContext)
    const dispatch = useContext(PluginDispatchContext)
    return (
        <FileUploadDropzone acceptedFileTypes={['application/json']} onSelectedFiles={(files) => {
            handleSelectedFiles(files, importMode, () => dispatch({type: 'FINISHED_LOAD_FILE'}))
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
                dispatch({type: 'START_LOAD_FILE'})
                handleSelectedFiles(files, importMode, () => dispatch({type: 'FINISHED_LOAD_FILE'}))
            }}>
                Select token file to import
            </FileUploadButton>
        </FileUploadDropzone>
    )
}

export const FileUpload = (): JSX.Element => {
    const context = useContext(PluginContext)

    if (context?.importState) return ComponentEnum[context.importState]

    return ComponentEnum.ready
}