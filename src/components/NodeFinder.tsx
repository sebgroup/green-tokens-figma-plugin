import { h, Component } from "preact";
import { useState, useEffect } from 'preact/hooks';
import { Button, MiddleAlign, Bold, Text } from "@create-figma-plugin/ui";

import '!./NodeFinder.css'

export function NodeFinder() {

    const [selectedNodeId, setSelectedNodeId] = useState(null);

    useEffect(() => {

        function handleMessage(event: { data: { pluginMessage: { type: string; nodeId: ((prevState: null) => null) | null; }; }; }) {
            if (event.data.pluginMessage.type === 'NODE_SELECTED') {
                setSelectedNodeId(event.data.pluginMessage.nodeId);
            }
        }

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <div class={"node-finder"}>
            <Text><Bold>Node ID:</Bold></Text>
            <div className="node-input">
                <input spellcheck={false} autocomplete={"off"} value={selectedNodeId ? `<FigmaSVG node="${selectedNodeId}" />` : ''} placeholder={selectedNodeId ? `` : 'Select a node'} />
                <Button onClick={() => {
                    const textToCopy = selectedNodeId ? `<FigmaSVG node="${selectedNodeId}" />` : '';
                    const textarea = document.createElement('textarea');
                    textarea.value = textToCopy;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    parent.postMessage({ pluginMessage: { type: 'COPIED_TO_CLIPBOARD', text: textToCopy } }, '*');
                }}> <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                </Button>
            </div>
        </div>
    );
}