import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FormBuilderApp extends LightningElement {

    /** User Registration Form Schema: {"title":"User Registration Form","type":"object","layout":"VerticalLayout","properties":{"person":{"title":"Person","type":"group","layout":"HorizontalLayout","properties":{"firstName":{"type":"string","title":"First Name"},"lastName":{"type":"string","title":"Last Name"},"gurdianName":{"type":"string","minLength":8,"maxLength":10,"title":"Gurdian Name","default":"John Cena","helpText":"Gurdian Name must be 8-10 characters long."}}},"fatherName":{"type":"string","minLength":8,"maxLength":10,"title":"Father Name","default":"John Cena","helpText":"Father Name must be 8-10 characters long."},"email":{"type":"string","format":"email","title":"Email Address","placeholder":"abc@example.com"},"role":{"type":"string","title":"User Role","enum":["Admin","Editor","Viewer"]},"bio":{"type":"string","title":"Biography","placeholder":"Tell us something about yourself...","options":{"multi":true,"rows":4}},"additionalInformation":{"title":"Additional Information","type":"group","layout":"HorizontalLayout","properties":{"Timezone":{"type":"string","minLength":8,"maxLength":10,"title":"Timezone","helpText":"Please set your Timezone according to your EST"},"completion_date":{"type":"string","title":"Date on Completion","helpText":"Please set your Timezone according to your EST"},"Office_Contact":{"description":"Age in years","type":"number","minimum":0,"title":"Enter your Office Contact #"}}},"settings":{"title":"Settings","type":"group","layout":"VerticalLayout","properties":{"firstName":{"type":"string","title":"First Name"},"lastName":{"type":"string","title":"Last Name"},"gurdianName":{"type":"string","minLength":8,"maxLength":10,"title":"Gurdian Name","default":"John Cena","helpText":"Gurdian Name must be 8-10 characters long."}}}},"required":["username","email","gurdianName"]} */
    formSchema = {"title":"Create New Account","type":"object","layout":"VerticalLayout","properties":{"account_details":{"title":"Account Details","type":"group","layout":"HorizontalLayout","properties":{"account_title":{"type":"string","title":"Account Title", "minLength": 8, "default": "Dummy Account"},"owner_name":{"type":"string","title":"Owner Name","helpText":"Enter the Account Owner name"},"account_status":{"type":"string","title":"Account Status","helpText":"Select the Account Status based on the Account Engagement","enum":["Hot","Warm","Cold"]},"company_address":{"type":"string","title":"Company Address","helpText":"Enter the Company's complete address","placeholder":"Write your Address here...","options":{"multi":true,"rows":"4"},"$ref":"#/properties/shipping_details/properties/shipping_address"}}},"additional_info":{"type":"string","title":"Additional Info","$ref":"#/properties/secret_info"},"shipping_details":{"title":"Shipping Details","type":"group","layout":"VerticalLayout","properties":{"shipping_address":{"type":"string","title":"Shipping Address","helpText":"Enter the complete Shipping address","placeholder":"Write your Shipping Address here...","options":{"multi":true,"rows":"4"}}}},"secret_info":{"type":"string","title":"Secret Info"}},"required":["account_title","owner_name","company_address","account_status","additional_info"]};
    formData = {};
    formErrors = {};
    @track referenceMap = {};
    @track formFieldList = [];



    connectedCallback() {

        this.initializeForm();

        //console.log('Form Schema: ', JSON.stringify(this.formSchema));
        
        // let referenceMap = this.buildRefMap(this.formSchema);
        // console.log('Reference Map: ', JSON.stringify(referenceMap));
        
    }

    initializeForm() {
        this.formFieldList = this.buildFormLayout(this.formSchema);
        this.buildRefMap(this.formSchema); // if you're using a reference map
        console.log('Reference Map: ', JSON.stringify(this.referenceMap));
        //console.log('Form Fields List: ', JSON.stringify(this.formFieldList));
        //console.log('On First Time Load Form Data: ', JSON.stringify(this.formData));
        
    }

    buildFormLayout(schema) {
        const requiredFields = schema.required || [];
        let isVerticalLayout = true;

        const processField = (name, config) => {
            let type = 'text';
            let options = {};
            let rows = config.options?.rows || 3;
    
            if (config.format === 'email') {
                type = 'email';
            }
    
            if (Array.isArray(config.enum)) {
                type = 'picklist';
                options = config.enum.map((value) => ({ label: value, value }));
            }
    
            if (config.options?.multi === true) {
                type = 'textarea';
            }
            
            this.buildFormData(name, type, config);

            return {
                name,
                label: config.title || name,
                type,
                value: this.formData[name] ?? config.default ?? '',  //config.default || '', // TODO Need to set the Default values based on the field Type
                required: requiredFields.includes(name),
                helpText: config.helpText,
                placeholder: config.placeholder,
                error: this.formErrors[name] || '',
                options,
                rows,
                isText: type === 'text' || type === 'email',
                isPicklist: type === 'picklist',
                isTextarea: type === 'textarea'
            };
        };
        

        return Object.entries(schema.properties).map(([name, config]) => {
            
            if (config.type === 'group' && config.layout === 'HorizontalLayout' && config.title) {
                isVerticalLayout = false;
                const groupFields = Object.entries(config.properties || {}).map(([childName, childConfig]) =>
                    processField(childName, childConfig)
                );
    
                //let columnCount = groupFields.length <= 3 ? 1 : groupFields.length <= 6 ? 2 : 3;
                let columnCount = 'slds-col'; //slds-p-around_small


                // console.log('Column are: ', columnCount);
                // console.log('Group Fields: ', JSON.stringify(groupFields));
                
                return {
                    isSection: true,
                    sectionTitle: config.title,
                    layout: config.layout,
                    columns: columnCount,
                    isVerticalLayout: isVerticalLayout,
                    fields: groupFields
                };
            }

            if (config.type === 'group' && config.layout === 'VerticalLayout' && config.title) {

                isVerticalLayout = true;
                const groupFields = Object.entries(config.properties || {}).map(([childName, childConfig]) =>
                    processField(childName, childConfig)
                );
    
                //let columnCount = groupFields.length <= 3 ? 1 : groupFields.length <= 6 ? 2 : 3;
                let columnCount = 'slds-col'; //slds-p-around_small


                // console.log('Column are: ', columnCount);
                // console.log('Group Fields: ', JSON.stringify(groupFields));
                
                return {
                    isSection: true,
                    sectionTitle: config.title,
                    layout: config.layout,
                    columns: columnCount,
                    isVerticalLayout: isVerticalLayout,
                    fields: groupFields
                };
            }
    
            return processField(name, config);
        });
    }

    buildFormData(name, type, config) {

        if (config?.default) {
            this.formData[name] = this.formData[name] ?? config?.default ?? ''; // config?.default || ''; 
        }
    }

    handleCloseToast() {
        console.log('hide error alert box...', this.hasErrors);
        
    }

    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
    
        this.formData = { 
            ...this.formData, 
            [field]: value 
        };

        console.log('After Change Field The Form Data: ', JSON.stringify(this.formData));
        
        this.updateReferencedField(field, value);
        this.validateField(field, value);
        //this.showValidationErrors();
    }

    updateReferencedField(field, value) {

        console.log('***** Updating Referenced Field with Value *****');
        
        console.log('Main Field: ', field , '  Main Value: ', value);

        const matchKey = Object.keys(this.referenceMap).find(key => key.endsWith(`.${field}`));

        if (matchKey) {
        
            console.log(`Match found: ${matchKey.split('.').pop()} → ${this.referenceMap[matchKey].split('.').pop()}`);
            const referencedField = this.referenceMap[matchKey].split('.').pop();
            const referencedValue = value;
    
            console.log('Referenced Field: ', referencedField , '  Referenced Value: ', referencedValue);
    
            this.formData = { 
                ...this.formData, 
                [referencedField]: referencedValue 
            };
            
        }
        else {
            console.log("No match found");
        }
        


        console.log('The Form Data after referenced Fields update: ', JSON.stringify(this.formData));
        
    }

    getFieldRules(path) {
        const parts = path.split('.');
        let current = this.formSchema;
    
        for (let part of parts) {
            if (!current || !current.properties || !current.properties[part]) {
                // Try to find recursively
                return this.findInSchema(this.formSchema, part);
            }
            current = current.properties[part];
        }
    
        return current;
    }
    
    findInSchema(schema, fieldName) {
        if (!schema || !schema.properties) return null;
    
        // eslint-disable-next-line guard-for-in
        for (const key in schema.properties) {
            const prop = schema.properties[key];
    
            if (key === fieldName) return prop;
    
            // If the property is a group or object, recurse into it
            if (prop.type === 'group' || prop.type === 'object') {
                const found = this.findInSchema(prop, fieldName);
                if (found) return found;
            }
        }
    
        return null;
    }

    buildRefMap(schema) {
        const refMap = {};
    
        function walk(obj, path = []) {
            if (obj && typeof obj === 'object') {
                if (obj.$ref) {
                    const from = path.join('.');
                    const to = obj.$ref
                        .replace('#/properties/', '')
                        .replace(/\/properties\//g, '.');
                    refMap[from] = to;
                }
    
                // eslint-disable-next-line guard-for-in
                for (const key in obj.properties || {}) {
                    walk(obj.properties[key], [...path, key]);
                }
            }
        }
    
        walk(schema);
        this.referenceMap = refMap;
        return refMap;
    }



    // eslint-disable-next-line no-unused-vars
    validateForm(data) {
        
        //console.log('***** Coming for Validating the Form through Button: ', JSON.stringify(data));
        
        Object.entries(this.formSchema.properties).forEach(([name, config]) => {
            if (config.type === 'group') {
                // eslint-disable-next-line no-unused-vars
                Object.entries(config.properties || {}).forEach(([childName, childConfig]) => {
                    const field = childName;
                    const value = data[childName];
                    this.formData = { ...this.formData, [field]: value };
                    this.validateField(field, value);
                });
                return;
            }
            
            
                const field = name;
                const value = data[name];
                this.formData = { ...this.formData, [field]: value };
                this.validateField(field, value);
            

        });
        this.showValidationErrors();
    }
    
    validateField(field, value) {
        //console.log(field + ' : ' + value);
    
        const rules = this.getFieldRules(field); // updated here
        if (!rules) {
            // console.warn(`No rules found for field: ${field}`);
            return;
        }
        
        // console.log('Validation Field Rules() : ', JSON.stringify(rules));
        let error = '';
    
        if (rules.minLength && value.length < rules.minLength) {
            error = `${rules.title || field} must be at least ${rules.minLength} characters.`;
        }
    
        if (rules.maxLength && value.length > rules.maxLength) {
            error = `${rules.title || field} must be no more than ${rules.maxLength} characters.`;
        }
    
        if (rules.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = `Please enter a valid ${rules.title || field}.`;
        }
    
        const requiredFields = this.formSchema.required || [];
        if (requiredFields.includes(field.split('.').pop()) && !value) {
            error = `${rules.title || field} is required.`;
        }
    
        this.formErrors = { ...this.formErrors, [field]: error };
    }
    
    showValidationErrors() {
        if (this.errorMessages.length === 0) return;
    
        // Join all error messages with bullet points
        const combinedMessage = this.errorMessages
            .map(error => `• ${error.message}`).join('\n');
    
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Please fix the following errors:',
                message: combinedMessage,
                variant: 'error',
                mode: 'sticky'
            })
        );
    }

    handleSubmit() {
        
        console.log(JSON.stringify(this.formData));
        
        // this.validateForm(this.formData);

        // if (this.hasErrors) {
        //     console.log('FORM ERRORS: ', JSON.stringify(this.formErrors));
        //     return;
        // }

        // // eslint-disable-next-line no-alert
        // alert('Form Submission Data: ', JSON.stringify(this.formData, null, 2));
    }

    get isFormValid() {
        return Object.values(this.formErrors).every((err) => !err);
    }

    get errorMessages() {
        return Object.entries(this.formErrors)
            // eslint-disable-next-line no-unused-vars
            .filter(([_, msg]) => !!msg) // Only include non-empty errors
            .map(([key, message]) => ({ key, message }));
    }
    
    get hasErrors() {
        return this.errorMessages.length > 0;
    }

    get fieldList() {
        return this.buildFormLayout(this.formSchema);
    }

    
    
}
