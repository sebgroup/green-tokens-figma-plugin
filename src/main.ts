import { emit, EventHandler, on, showUI } from "@create-figma-plugin/utilities";
const { getLocalVariableCollections, getLocalVariables } = figma.variables;
import chroma from "chroma-js";

/**
 *
 * We need to get the local variables and collections and call the getters on each property.
 * If we don't do this the values will be undefined when passed to the UI.
 * @returns { Promise<{localVariables: {id: string, name: string, collectionId: string}[], localCollections: {id: string, name: string, modes: {modeId: string, name: string}[], defaultModeId: string}[]}>}
 */
async function getLocalData() {
  return {
    localVariables: await figma.variables
      .getLocalVariablesAsync()
      .then((variables) => variables.map((variable) => ({ id: variable.id, name: variable.name, collectionId: variable.variableCollectionId }))),
    localCollections: figma.variables.getLocalVariableCollections().map((collection) => ({
      id: collection.id,
      name: collection.name,
      modes: collection.modes,
      defaultModeId: collection.defaultModeId,
    })),
  };
}

function hexToFigmaColor(color: string) {
  return {
    r: chroma(color).rgb()[0] / 255,
    g: chroma(color).rgb()[1] / 255,
    b: chroma(color).rgb()[2] / 255,
  };
}

export default () => {
  on("IMPORT_TOKENS", async (data: any) => {
    console.log(data);
  });

  on("EXECUTE_IMPORT", async ({ variablesToCreate, variablesToUpdate, collectionId }) => {
    const variableCollection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    let lightModeId, darkModeId;

    if (variableCollection) {
      variableCollection.modes.forEach((mode) => {
        if (mode.name.toUpperCase() === "LIGHT") {
          lightModeId = mode.modeId;
        }
        if (mode.name.toUpperCase() === "DARK") {
          darkModeId = mode.modeId;
        }
      });

      if (!lightModeId) {
        lightModeId = variableCollection.defaultModeId;
        if (lightModeId) {
          variableCollection.renameMode(lightModeId, "Light");
        }
      }

      if (!darkModeId) {
        darkModeId = variableCollection.addMode("Dark");
      }

      for (let index = 0; index < variablesToCreate.length; index++) {
        const variable = variablesToCreate[index];
        const createdVariable = figma.variables.createVariable(variable.name, variableCollection, variable.type.toUpperCase());

        if (createdVariable.resolvedType === "COLOR") {
          if (lightModeId && variable.value) {
            createdVariable.setValueForMode(lightModeId, hexToFigmaColor(variable.value));
          }
          if (darkModeId) {
            if (variable.darkValue) {
              createdVariable.setValueForMode(darkModeId, hexToFigmaColor(variable.darkValue));
            } else {
              createdVariable.setValueForMode(darkModeId, hexToFigmaColor(variable.value));
            }
          }
        }
      }

      for (let index = 0; index < variablesToUpdate.length; index++) {
        const variable = variablesToUpdate[index];
        const existingVariable = figma.variables.getVariableById(variable.id);

        if (existingVariable) {
          if (existingVariable.resolvedType === "COLOR") {
            if (lightModeId && variable.value) {
              figma.variables.getVariableById(variable.id)?.setValueForMode(lightModeId, hexToFigmaColor(variable.value));
            }
            if (darkModeId && variable.darkValue) {
              figma.variables.getVariableById(variable.id)?.setValueForMode(darkModeId, hexToFigmaColor(variable.darkValue));
            }
          }
        }
      }
    } else {
      throw new Error("Variable collection not found");
    }

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
    getLocalData().then((data) => emit("SET_LOCAL_DATA", data));
  });

  on("selectionchange", () => {
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
    figma.notify("Node copied to clipboard!");
  });

  showUI({ height: 400, width: 320 });

  getLocalData().then((data) => emit("SET_LOCAL_DATA", data));
};
