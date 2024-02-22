import { emit, EventHandler, on, showUI } from "@create-figma-plugin/utilities";
import { VALID_COLLECTIONS_NAMES } from "./constants";
import { Token } from "./types";
import { InterimVariable } from "./classes/InterimVariable";

const { getLocalVariableCollections, getLocalVariables } = figma.variables;

function getLocalData() {
  return {
    localVariables: figma.variables.getLocalVariables().map((variable) => ({
      id: variable.id,
      name: variable.name,
    })),
    localCollections: figma.variables.getLocalVariableCollections().map((collection) => ({
      id: collection.id,
      name: collection.name,
    })),
  };
}

function checkValidCollections() {
  const localCollections = getLocalVariableCollections();
  localCollections.forEach((collection) => {
    const { name } = collection;
    if (VALID_COLLECTIONS_NAMES.includes(name)) return;
    throw new Error(`Your Figma file must contain two variable collections named ${VALID_COLLECTIONS_NAMES.join(" and ")} in order for this plugin to work.`);
  });
}

export default () => {
  let refVariables: InterimVariable[];
  let sysVariables: InterimVariable[];

  on("IMPORT_TOKENS", async (tokens: Token[]) => {
    const interimVariables = tokens.map((token) => new InterimVariable(token));

    refVariables = interimVariables.filter((item) => !item.alias);
    sysVariables = interimVariables.filter((item) => item.alias);

    emit<EventHandler>("VARIABLES_PREPARED", {
      refToBeCreated: refVariables.filter((item) => !item.existingFigmaVariable),
      refToBeUpdated: refVariables.filter((item) => !!item.existingFigmaVariable),
      sysToBeCreated: sysVariables.filter((item) => !item.existingFigmaVariable),
      sysToBeUpdated: sysVariables.filter((item) => !!item.existingFigmaVariable),
    } as any);
  });

  on("EXECUTE_IMPORT", ({ refToBeCreated, refToBeUpdated, sysToBeCreated, sysToBeUpdated }: { refToBeCreated: boolean; refToBeUpdated: boolean; sysToBeCreated: boolean; sysToBeUpdated: boolean }) => {
    refVariables.forEach((variable) => {
      if (refToBeCreated && !variable.existingFigmaVariable) {
        variable.createFigmaVariable();
      }
      if (refToBeUpdated && !!variable.existingFigmaVariable) {
        variable.updateValueByMode();
      }
    });

    sysVariables.forEach((variable) => {
      if (sysToBeCreated && !variable.existingFigmaVariable) {
        variable.createFigmaVariable();
      }

      if (sysToBeUpdated && !!variable.existingFigmaVariable) {
        variable.updateValueByMode();
      }
    });

    refVariables = [];
    sysVariables = [];

    emit("IMPORT_FINISHED");
  });

  on("EXPORT_VARIABLES", () => {
    const collections = getLocalVariableCollections().map((item) => ({
      id: item.id,
      name: item.name,
      modes: item.modes,
      defaultModeId: item.defaultModeId,
    }));

    const variables = getLocalVariables().map((item) => ({
      name: item.name,
      id: item.id,
      variableCollection: collections.find((collection) => collection.id === item.variableCollectionId),
      description: item.description,
      valuesByMode: item.valuesByMode,
      resolvedType: item.resolvedType,
    }));

    emit("SAVE_VARIABLES_TO_FILE", variables as any);
  });

  on("CREATE_REF_AND_SYS_COLLECTIONS", () => {
    figma.variables.createVariableCollection("ref");
    const sysCollection = figma.variables.createVariableCollection("sys");
    sysCollection.renameMode(sysCollection.defaultModeId, "Light");
    sysCollection.addMode("Dark");
    emit("SET_LOCAL_DATA", getLocalData());
  });

  figma.on("selectionchange", () => {
    const selectedNodes = figma.currentPage.selection;
    if (selectedNodes.length > 0) {
      const nodeId = selectedNodes[0].id.replace(":", "-");
      figma.ui.postMessage({ type: "NODE_SELECTED", nodeId });
      console.log("Selected node ID:", nodeId);
    } else {
      figma.ui.postMessage({ type: "NODE_SELECTED", nodeId: null });
      console.log("No node selected");
    }
  });

  on("COPIED_TO_CLIPBOARD", (message) => {
    if (message.type === "COPIED_TO_CLIPBOARD") {
      figma.notify("Node copied to clipboard!");
    }
  });

  showUI({ height: 400, width: 320 });

  emit("SET_LOCAL_DATA", getLocalData());
};
