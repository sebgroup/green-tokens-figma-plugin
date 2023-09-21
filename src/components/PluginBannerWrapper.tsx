import {Banner, IconCheckCircle32, IconWarning32, Stack} from "@create-figma-plugin/ui";
import {h} from "preact";
import {useContext} from "preact/compat";
import {PluginContext, PluginDispatchContext} from "../ui";

export function PluginBannerWrapper() {
    const state = useContext(PluginContext)
    return (
        <Stack space="small">
            {state.successMsg && <Banner icon={<IconCheckCircle32/>} variant="success">{state.successMsg}</Banner>}
            {state.errorMsg && <Banner icon={<IconWarning32/>} variant="warning">{state.errorMsg}</Banner>}
        </Stack>
    )
}