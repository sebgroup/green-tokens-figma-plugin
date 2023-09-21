import {Token} from "../types";
import chroma from "chroma-js";

export class InterimVariable {
    id: string | undefined
    name: string
    description: string | undefined
    newValuesByMode: {
        [modeId: string]: VariableValue
    } = {}
    resolvedDataType: VariableResolvedDataType
    alias: boolean
    originalId?: string
    existingFigmaVariable: Variable | undefined
    variableCollectionId: string | undefined | null
    variableCollection: VariableCollection | null | undefined

    constructor(token: Token) {
        this.id = token.attributes.figma.id
        this.name = token.path.slice(1, token.path.length).join('/')
        this.description = token.description
        this.resolvedDataType = token.attributes.figma.resolvedType
        this.originalId = token.attributes.figma.originalId
        this.alias = !!this.originalId


        this.checkForExistingVar()
        this.setUpVariableCollection()
        this.setUpValuesByMode(token)
    }

    private checkForExistingVar() {
        //worker.postMessage({data: [20,20]})
        this.existingFigmaVariable = figma.variables.getLocalVariables().find(variable => {
            if (variable.id === this.id) return true
            if (variable.name === this.name) return true
        })
    }

    private setUpVariableCollection() {
        if (this.existingFigmaVariable) {
            this.variableCollectionId = this.existingFigmaVariable.variableCollectionId
            this.variableCollection = figma.variables.getVariableCollectionById(this.existingFigmaVariable.variableCollectionId)
        }

        try {
            if (this.id) {
                this.variableCollectionId = figma.variables.getVariableById(this.id)?.variableCollectionId

                if (this.variableCollectionId) {
                    this.variableCollection = figma.variables.getVariableCollectionById(this.variableCollectionId)
                }
            }
        } catch (err) {
            const localCollections = figma.variables.getLocalVariableCollections()

            if (this.originalId) {
                this.variableCollection = localCollections.find(collection => collection.name?.toLowerCase() === 'sys')
            } else if (this.variableCollectionId) {
                this.variableCollection = figma.variables.getVariableCollectionById(this.variableCollectionId)
            } else {
                this.variableCollection = localCollections.find(collection => collection.name?.toLowerCase() === 'ref')
            }

            this.variableCollectionId = this.variableCollection?.id
        }
    }

    private setUpValuesByMode(token: Token) {
        if (this.variableCollection) {
            this.variableCollection.modes.forEach(mode => {
                const value = mode.name.toLowerCase() === 'dark' ? token.darkValue : token.value;
                if (!value) {
                    if (token.attributes.figma.resolvedType === "COLOR") {
                        console.error(`No dark mode value set on token: ${token.name}`)
                    } else if (token.attributes.figma.resolvedType === "FLOAT" && typeof token.value === 'string') {
                        this.newValuesByMode[mode.modeId] = parseFloat(token.value);
                    } else {
                        this.newValuesByMode[mode.modeId] = token.value;
                    }
                } else {
                    if (token.attributes.figma.resolvedType === "COLOR" && chroma.valid(value)) {
                        const rgbaColor = chroma(value as string).rgba();
                        this.newValuesByMode[mode.modeId] = {
                            r: rgbaColor[0] / 255,
                            g: rgbaColor[1] / 255,
                            b: rgbaColor[2] / 255,
                            a: rgbaColor[3]
                        };
                    } else if (token.attributes.figma.resolvedType === "FLOAT" && typeof token.value === 'string') {
                        this.newValuesByMode[mode.modeId] = parseFloat(token.value);
                    } else {
                        this.newValuesByMode[mode.modeId] = token.value;
                    }

                }
            })
        } else {
            this.newValuesByMode['light'] = token.value;
            if (token.darkValue) {
                this.newValuesByMode['dark'] = token.darkValue;
            }

        }

    }

    /* Checks if there is diff between token value being imported and variable value in Figma */
    hasDiff() {
        try {
            if (this.existingFigmaVariable?.valuesByMode) {
                const diffArray: boolean[] = []

                for (const [key, value] of Object.entries(this.newValuesByMode)) {
                    if (['string', 'boolean', 'number'].includes(typeof value)) {
                        diffArray.push((value !== this.existingFigmaVariable?.valuesByMode[key]))
                    }

                    if (typeof value === 'object') {
                        Object.entries(this.newValuesByMode[key]).forEach(([key2, value2]) => {
                            // @ts-ignore
                            diffArray.push((value2 !== this.existingFigmaVariable?.valuesByMode[key][key2]))
                        })

                    }
                }

                return diffArray.includes(true)
            }
        } catch (err) {
            return true
        }
    }

    createFigmaVariable() {
        if (this.name && this.variableCollectionId && this.resolvedDataType) {

            const figmaVariable = figma.variables.createVariable(this.name, this.variableCollectionId, this.resolvedDataType)

            for (const [modeId, value] of Object.entries(this.newValuesByMode)) {
                figmaVariable.setValueForMode(modeId, value)
            }

            return figmaVariable
        } else {
            console.error('To create a Figma variable we need the following properties: name, variableCollectionId, type')
        }

    }
}