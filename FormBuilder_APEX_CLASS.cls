public class FormSchemaBuilder {
	
    /**String formObjectMappingId = 'a00NS00000m5gz3YAA';
	FormSchemaBuilder fsb = new FormSchemaBuilder(formObjectMappingId);
	fsb.build();*/
    
    String formObjectMappingId;
    public formSchemaBuilder(String formObjectMappingId) {
        this.formObjectMappingId = formObjectMappingId;
    }
    
    public List<FormObjectMapping__c> fetchFormObjectMapping() {
        return [
            SELECT Id, Name, form_title__c, form_type__c, Form_Width__c, Form_Logo_Image__c, Form_Logo_Alt_Name__c, Form_Logo_Width__c, Form_Logo_Height__c, Form_Logo_Alignment__c, Form_Action__c, Form_Action_Method__c, Heading_Alignment__c, Heading_Variant__c, Heading_Text_Transform__c, Heading_Text_Weight__c, Heading_Text_Style__c
            FROM FormObjectMapping__c 
            WHERE Id =: formObjectMappingId
        ];
    }
    
    public List<Form_Field_Mapping__c> fetchFormFieldMapping() {
        return [
            SELECT Id, Name, field_label__c, field_api_name__c, Field_Type__c, Is_Required__c, Form_Sequence__c, Default_Value__c, Help_Text__c, Placeholder__c, Minimum_Length__c, Maximum_Length__c, Format__c, Regex_Pattern__c
			FROM Form_Field_Mapping__c 
            WHERE Form_Source_Lookup__c =: formObjectMappingId 
            ORDER BY Form_Sequence__c desc
        ];
    }
    
    public String build() {
        
        // Query the Form Object Mapping
        List<FormObjectMapping__c> fom = fetchFormObjectMapping();
        System.debug('Form Title: ' + fom[0].form_title__c + ' & Type: ' + fom[0].form_type__c);
        
        Map<String, Object> formSchema = new Map<String, Object>();
        Map<String, Object> uiSchema = new Map<String, Object>();
        Map<String, Object> formMeta = new Map<String, Object>();
        
        // Prepare Form Metadata

        
        formSchema.put('type', 'object');
        
        uiSchema.put('type', 'VerticalLayout'); // TODO: Make it configurable
        List<Object> uiElements = new List<Object>();
        
        // Fetch Field Mappings Record
        Map<String, Object> schemaProperties = new Map<String, Object>();
        List<String> requiredFieldList = new List<String>();
        
        List<Form_Field_Mapping__c> ffm = fetchFormFieldMapping();
        for(Form_Field_Mapping__c fm: ffm) {
			
            // Add Schema Properties
            Map<String, Object> fieldProperties = new Map<String, Object>();
            setFieldSchemaProperties(fm, fieldProperties, requiredFieldList);
            schemaProperties.put(fm.field_api_name__c, fieldProperties);
            
            // Add UI Element Properties
            Map<String, Object> elementProperties = new Map<String, Object>();
            setUiElementProperties(fm, elementProperties);
            uiElements.add(elementProperties);
        }

        formSchema.put('required', requiredFieldList);
        formSchema.put('properties', schemaProperties);
        uiSchema.put('elements', uiElements);
        
        
        
		
        // Now add Form fields
        //List<Form_Field_Mapping__c> ffm = fetchFormFieldMapping();
        //Map<String, Object> properties = new Map<String, Object>();
        
        
        // Show Schema Build...
        String jsonOutput = JSON.serialize(formSchema);
        System.debug(jsonOutput);
        
        // Show UI Schema Build...
        String jsonUiOutput = JSON.serialize(uiSchema);
        System.debug(jsonUiOutput);
        
        // Show Form Meta Build...
        String jsonFormMetaOutput = JSON.serialize(formMeta);
        System.debug(jsonFormMetaOutput);
        
        return 'Form Schema Build Complete!';
    }
    
    public void setFieldSchemaProperties(Form_Field_Mapping__c fm, Map<String, Object> fieldProperties, List<String> requiredFieldList) {
        String fieldType = fm.Field_Type__c.replace('#', '');
        
        if(fieldType == 'textarea') {
            fieldType = 'string';
        }
        fieldProperties.put('type', fieldType);
        if(String.isNotBlank(fm.field_label__c) && fm.field_label__c != null) { fieldProperties.put('title', fm.field_label__c); }
        if(String.isNotBlank(fm.Help_Text__c) && fm.Help_Text__c != null) { fieldProperties.put('description', fm.Help_Text__c); }
        if(String.isNotBlank(fm.Default_Value__c) && fm.Default_Value__c != null) { fieldProperties.put('default', fm.Default_Value__c); }
        
        if(fm.Minimum_Length__c != null && fm.Minimum_Length__c >= 0) { fieldProperties.put('minLength', fm.Minimum_Length__c); }
        if(fm.Maximum_Length__c != null && fm.Maximum_Length__c > 0) { fieldProperties.put('maxLength', fm.Maximum_Length__c); }
        
        
        if(String.isNotBlank(fm.Format__c) && fm.Format__c != null) { fieldProperties.put('format', fm.Format__c); }
        if(String.isNotBlank(fm.Regex_Pattern__c) && fm.Regex_Pattern__c != null) { fieldProperties.put('pattern', fm.Regex_Pattern__c); }
        
        if(fm.Is_Required__c) {
            requiredFieldList.add(fm.field_api_name__c);
        }
        
    }
    
    public void setUiElementProperties(Form_Field_Mapping__c fm, Map<String, Object> elementProperties) {
        
        Map<String, Object> fieldOptions = new Map<String, Object>();
        
        // Add Placeholder
        if(String.isNotBlank(fm.Placeholder__c) && fm.Placeholder__c != null) { fieldOptions.put('placeholder', fm.Placeholder__c); }
        // Make Textarea
        if(fm.Field_Type__c == '#textarea' && fm.Field_Type__c != null) { 
            fieldOptions.put('multi', true);
            //fieldOptions.put('rows', 5);
            //fieldOptions.put('trim', false);
        }	
        
        elementProperties.put('options', fieldOptions);
        elementProperties.put('scope', '#/properties/'+fm.field_api_name__c);
        elementProperties.put('type', 'Control');
    }
    
    public void buildFormMetadata(List<FormObjectMapping__c> fom, Map<String, Object> formMeta) {
        formMeta.put('title', fom[0].form_title__c);
        formMeta.put('width', fom[0].Form_Width__c);
        //Heading_Alignment__c, Heading_Variant__c, Heading_Text_Transform__c, Heading_Text_Weight__c, Heading_Text_Style__c
        formMeta.put('headerOptions', new Map<String, Object>{
            'alignment' => fom[0].Heading_Alignment__c
        });
        formMeta.put('actions', new Map<String, String>{
            'calloutApi' => fom[0].Form_Action__c, 
            'method' => fom[0].Form_Action_Method__c
        });
        formMeta.put('logo', new Map<String, String>{
            'src' => fom[0].Form_Logo_Image__c, 
            'alt_name' => fom[0].Form_Logo_Alt_Name__c,
            'width' => fom[0].Form_Logo_Width__c,
            'height' => fom[0].Form_Logo_Height__c,
            'align' => fom[0].Form_Logo_Alignment__c
        });
    }
    
}