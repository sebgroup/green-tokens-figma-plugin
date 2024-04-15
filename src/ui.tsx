import { Container, render, Tabs, TabsOption } from "@create-figma-plugin/ui";
import { on } from "@create-figma-plugin/utilities";
import { createContext, h } from "preact";
import { useEffect, useReducer, useState } from "preact/hooks";
import { Import } from "./components";
import { IPluginState, ReportErrorHandler, ReducerAction } from "./types";
import { pluginReducer } from "./reducers/plugin";
import { Export } from "./components/Export";
import { NodeFinder } from "./components/node-finder/NodeFinder";
import { IMGSync } from "./components/sync-images/sync-images";

const initialState: IPluginState = {
  errorMsg: null,
  successMsg: null,
  importExport: "import",
  importMode: "ref",
  importState: "loading",
  localVariables: [],
  localCollections: [],
  importToCollection: null,
};

export const PluginContext = createContext<IPluginState>(initialState);
export const PluginDispatchContext = createContext<
  (action: ReducerAction) => void
>(() => {});

function Plugin() {
  const [state, dispatch] = useReducer<IPluginState, ReducerAction>(
    pluginReducer,
    initialState
  );
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    on("SET_LOCAL_DATA", ({ localVariables, localCollections }) => {
      dispatch({ type: "SET_LOCAL_VARIABLES", localVariables });
      dispatch({ type: "SET_LOCAL_COLLECTIONS", localCollections });
      dispatch({ type: "SET_IMPORT_STATE", importState: "ready" });
    });

    on<ReportErrorHandler>("REPORT_ERROR", (errorMsg) => {
      dispatch({ type: "SET_ERROR_MESSAGE", errorMsg });
    });

    on("SAVE_VARIABLES_TO_FILE", (variables) => {
      const blob = new Blob([JSON.stringify(variables)], {
        type: "application/json",
      });

      const blobURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const name = "variables.json";
      link.href = blobURL;
      link.download = name;
      link.click();
      link.setAttribute("download", name);
    });

    on("IMPORT_FINISHED", () => {
      dispatch({ type: "SET_IMPORT_STATE", importState: "finished" });
    });

    on("NODE_SELECTED", (selectedNodeId) => {
      console.log("Selected Node:", selectedNodeId);
      setSelectedNodeId(selectedNodeId);
    });
  }, []);

  const [tabs, setTabs] = useState<string>("Node");
  const options: Array<TabsOption> = [
    {
      children: <NodeFinder node={selectedNodeId || ""} />,
      value: "Node",
    },
    {
      children: <Import />,
      value: "Import",
    },
    {
      children: <Export />,
      value: "Export",
    },
    {
      children: <IMGSync />,
      value: "Sync",
    },
  ];

  function changeTabs(newValue: string) {
    setTabs(newValue);
  }

  return (
    <PluginContext.Provider value={state}>
      <PluginDispatchContext.Provider value={dispatch}>
        <Container space="medium">
          <Tabs onValueChange={changeTabs} options={options} value={tabs} />
        </Container>
      </PluginDispatchContext.Provider>
    </PluginContext.Provider>
  );
}

export default render(Plugin);
