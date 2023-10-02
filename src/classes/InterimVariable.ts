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
    existingFigmaVariable: Variable | undefined | null
    variableCollectionId: string | undefined | null
    variableCollection: VariableCollection | null | undefined

    constructor(token: Token) {
        this.id = token.attributes.figma.id
        this.name = token.path.slice(1, token.path.length).join('/')
        this.description = token.description
        this.resolvedDataType = token.attributes.figma.resolvedType
        this.originalId = token.attributes.figma.originalId
        this.alias = !!this.originalId

        this.setUpExistingVariable(token)
        this.setUpVariableCollection()
        this.setUpValuesByMode(token)
    }

    private setUpExistingVariable (token: Token) {
        if (!token.attributes.figma.originalId && token.attributes.figma.matchedVariable?.id) {

            this.existingFigmaVariable = figma.variables.getLocalVariables().find(variable => variable.id === token.attributes.figma.matchedVariable?.id)

            this.alias = this.existingFigmaVariable?.name !== this.name;

        } else if (token.attributes.figma.originalId) {
            this.existingFigmaVariable = figma.variables.getLocalVariables().find(variable => variable.id === token.attributes.figma.matchedVariable?.id)
        }

    }

    private setUpVariableCollection() {
        if (this.existingFigmaVariable) {
            this.variableCollectionId = this.existingFigmaVariable.variableCollectionId
            this.variableCollection = figma.variables.getVariableCollectionById(this.existingFigmaVariable.variableCollectionId)
        }

        try {
            if (this.id) {
                this.variableCollectionId = figma.variables.getLocalVariables().find(variable => variable.id === this.id)?.variableCollectionId

                if (this.variableCollectionId) {
                    this.variableCollection = figma.variables.getLocalVariableCollections().find(collection => collection.id === this.variableCollectionId)
                }
            } else {
                if (this.alias) {
                    this.variableCollection = figma.variables.getLocalVariableCollections().find(collection => collection.name.toLowerCase() === 'sys')
                    this.variableCollectionId = this.variableCollection?.id
                }
            }
        } catch (err) {
            console.error(err)
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
                    } else if (token.attributes.figma.resolvedType === "FLOAT" && typeof value === 'string') {
                        this.newValuesByMode[mode.modeId] = parseFloat(value);
                    } else {
                        this.newValuesByMode[mode.modeId] = value;
                    }

                }
            })
        } else {
            this.newValuesByMode['default'] = token.value;
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

    updateValueByMode() {
        if (!this.variableCollection) return

        if (this.alias) {
            this.variableCollection.modes.forEach(mode => {
                if (this.newValuesByMode[mode.modeId]) {
                    this.existingFigmaVariable?.setValueForMode(mode.modeId, this.newValuesByMode[mode.modeId])
                }
            })

        } else {
            this.existingFigmaVariable?.setValueForMode(this.variableCollection.defaultModeId, this.newValuesByMode[this.variableCollection.defaultModeId])
        }
    }
}