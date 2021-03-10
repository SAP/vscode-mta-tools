/**
 * This interface defines the API that must be provided
 * by `activate` method of the extension, that contributes to the Tasks Explorer
 */
export interface TaskEditorContributorExtensionAPI<T extends ConfiguredTask> {
    /** Task Explorer uses this method to extract APIs of Task Contributors
     * provided result maps `type` of the task to the contribution API
     */
    getTaskEditorContributors(): Map<string, TaskEditorContributionAPI<T>>;
  }
  
  /**
   * This interface defines the tasks managed by Tasks Explorer
   * The task has 3 mandatory fields and arbitrary number of other fields
   * that have to match task definition in the package.json file
   */
  export interface ConfiguredTask {
    /* unique label of the task */
    label: string;
    /* type of the task; the value has to match value defined in the task definition in the package.json */
    type: string;
  
    /* other properties of the task */
    [propertyName: string]: any;
  }
  
  /**
   * This interface defines the input provided by user in the task editor
   */
  export interface TaskUserInput {
    [formPropertyName: string]: any;
  }
  
  /**
   * This function type is used for defining the validation functional parameter ("isValid") of
   * the simple UI property, provided by Task Contributor
   */
  export type isSimpleFormPropertyValid = (
    /**
     * @param value simple value provided by the user in the form
     * @@return result of validation: error message; empty string indicates valid property
     */
    value: string
  ) => Promise<string> | string;
  
  /**
   * This function type is used for defining the validation functional parameter ("isValid") of
   * the array UI property, provided by Task Contributor
   */
  export type isArrayFormPropertyValid = (
    /**
     * @param value array value (in case of checkbox) provided by the user in the form
     * @@return result of validation: error message; empty string indicates valid property
     */
    value: string[]
  ) => Promise<string> | string;
  
  export type isFormPropertyValid =
    | isSimpleFormPropertyValid
    | isArrayFormPropertyValid;
  
  /**
   * This interface defines the form property attributes that are relevant for any kind of property
   * each attribute is optional, but form property is not valid if it does not answer to one of the following cases:
   * - property with type "label"
   * - task based property has to include attribute "taskProperty"
   * - code based property has to include attributes "name", "message" and "value"
   */
  export interface CommonFormPropertyAttributes {
    /** name of the property in the ConfiguredTask definition
     * if provided it's value will be used for naming property in the form, when `name` attribute is missing
     * and corresponding description of the task field in the package.json will be used for titling the field
     * when `message` attribute is missing
     */
    taskProperty?: string;
    /* name of the property in the form */
    name?: string;
    /* title of the property in the form */
    message?: string;
    /* hint of the property in the form */
    hint?: string;
    /* indicator if property in the form is mandatory or not */
    optional?: boolean;
    /* indicator if property in the form is read only */
    readonly?: boolean;
    /* function that checks validity of the property */
    isValid?: isFormPropertyValid;
  }
  
  /**
   * types of the simple form properties
   *
   * type 'label' is used for task property 'label'
   * label uniqueness validation will be automatically created for such property
   * in case user defined validation for 'label' property it will be extended
   * with uniqueness check
   */
  export type FormPropertyType = "label" | "input" | "folder" | "file" | "editor";
  
  /**
   * This interface defines simple properties of the form:
   * task label, input field, path to folder, path to file
   */
  export interface SimpleFormProperty extends CommonFormPropertyAttributes {
    type: FormPropertyType;
    value?: string;
  }
  
  /**
   * This interface is a base interface for a set of interfaces:
   * CheckboxFormProperty, ComboboxFormProperty, TableFormProperty
   */
  export interface ListFormProperty extends CommonFormPropertyAttributes {
    list: string[];
    value?: any;
  }
  
  /**
   * This interface defines a checkbox property
   * value provides subset of values of the `list` property
   * that will be checked on
   */
  export interface CheckboxFormProperty extends ListFormProperty {
    type: "checkbox";
    value?: string[];
  }
  
  /**
   * This interface defines a combobox property
   * value provides current selection of the combobox
   */
  export interface ComboboxFormProperty extends ListFormProperty {
    type: "combobox";
    value?: string;
  }
  
  /**
   * This interface defines a very primitive table property
   * value provides line selected in the table
   */
  export interface TableFormProperty extends ListFormProperty {
    type: "table";
    value?: string;
  }
  
  /**
   * This interface defines a primitive radio button property
   * with `Yes` and `No` choices
   */
  export interface YesNoFormProperty extends CommonFormPropertyAttributes {
    type: "confirm";
    value?: boolean;
  }
  
  /**
   * This interface defines all supported variations of the form properties
   */
  export type FormProperty =
    | SimpleFormProperty
    | YesNoFormProperty
    | CheckboxFormProperty
    | ComboboxFormProperty
    | TableFormProperty;
  
  /**
   * This interface task contributor API
   * Task provider that is supposed to contribute to the Tasks Explorer
   * has to implement this interface and to provide it
   * in the `activate` method of the implementing extension
   */
  export interface TaskEditorContributionAPI<T extends ConfiguredTask> {
    /**
     * this method is called every time the task editor is opened.
     * Use this method to make the needed initializations before editing the tasks.
     * @param wsFolder - workspace folder where task is defined (in the tasks.json file)
     * @param task - edited task
     */
    init(wsFolder: string, task: T): Promise<void>;
  
    /**
     * this method is used by the Task Explorer for the conversion of the task to the form properties
     * to be displayed in the UI
     * @param task - edited task
     * @@return array of the form properties
     */
    convertTaskToFormProperties(task: T): FormProperty[];
  
    /**
     * this method is used by the Task Explorer to update task based on the user inputs in the form
     *
     * the very basic implementation of this method
     * will look like:
     * return {...task, ...inputs}
     * such implementation is enough when task has only input properties and they are used on the form
     * with the same names
     * in more complex cases contributor must implement a logic that updates
     * task in accordance to the inputs of the user
     * @param task - current content of the task
     * @param inputs - inputs made by the user in the form
     * @@return updated task
     */
    updateTask(task: T, inputs: TaskUserInput): T | Promise<T>;
  
    /**
     * this method is used by the Tasks Explorer
     * for getting the image of the task to be presented on the task's form
     * Make sure to provide an image that fits the different color themes.
     * It should not contain very light or very dark colors.
     * @@return a base64 encoded image string
     */
    getTaskImage(): string;
  
    /**
     * this method is used by the Task Explorer
     * to inform the task provider that the user made changes in the task's configuration.
     * This method is optional and can include a logic related to this event,
     * such as adding logs or usage analytics events
     */
    onSave?(task: T): void | Promise<void>;
  }
  