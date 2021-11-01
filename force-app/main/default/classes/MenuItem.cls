public with sharing class MenuItem {
	@AuraEnabled
    public String id {get;set;}
    
    @AuraEnabled
    public String name {get;set;}
    
    @AuraEnabled
    public Integer quantity {get;set;}
    
    @AuraEnabled
    public Double price {get;set;}

    @AuraEnabled
    public String type {get;set;}
}
