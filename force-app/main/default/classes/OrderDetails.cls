public with sharing class OrderDetails {
	@AuraEnabled
    public String accountId {get;set;}

    @AuraEnabled
    public String priceBookId {get;set;}

    @AuraEnabled
    public String contactId {get;set;}
    
    @AuraEnabled
    public String deliveryTime {get;set;}
    
    @AuraEnabled
    public String comment {get;set;}
    
    @AuraEnabled
    public Boolean notify {get;set;}
}
