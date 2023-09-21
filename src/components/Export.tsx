import {Button, MiddleAlign} from "@create-figma-plugin/ui";
import {emit} from "@create-figma-plugin/utilities";
import {h} from "preact";

export function Export() {
    return (
        <div style={{height: 250}}>
            <MiddleAlign>
                <Button fullWidth onClick={() => {
                    emit('EXPORT_VARIABLES')
                }}>Export JSON file</Button>
            </MiddleAlign>
        </div>
    )
}