import {
  Container,
  Divider,
  render,
  Stack,
  VerticalSpace,
  Text,
} from "@create-figma-plugin/ui";
import { on } from "@create-figma-plugin/utilities";
import { createContext, h } from "preact";
import { useEffect, useReducer, useState } from "preact/hooks";
import {
  Import,
  ImportExportSegmentedControl,
  PluginBannerWrapper,
} from "./components";
import { IPluginState, ReportErrorHandler, ReducerAction } from "./types";
import { pluginReducer } from "./reducers/plugin";
import { Export } from "./components/Export";
import { NodeFinder } from "./components/node-finder/NodeFinder";

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

const ImportExportContainer = {
  import: <Import />,
  export: <Export />,
};

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

    //emit<GetVariableCollectionsHandler>('GET_COLLECTIONS')
  }, []);

  return (
    <PluginContext.Provider value={state}>
      <PluginDispatchContext.Provider value={dispatch}>
        <Container space="medium">
          <VerticalSpace space="small" />
          <Stack space="small">
            <PluginBannerWrapper />
            <ImportExportSegmentedControl />
            <Divider />
            {ImportExportContainer[state.importExport]}
          </Stack>
          <Stack space="small">
            <VerticalSpace space="small" />
            <Divider />
            <NodeFinder node={selectedNodeId || ""} />
          </Stack>
        </Container>
      </PluginDispatchContext.Provider>
    </PluginContext.Provider>
  );
}

export default render(Plugin);
