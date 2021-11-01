public with sharing class MenuItems {
    private static Map<Id, PricebookEntry> getPricebookEntryRecords(Id pricebook2Id) {
        List<PricebookEntry> pb = [SELECT UnitPrice, Product2Id FROM PricebookEntry WHERE Pricebook2Id = :pricebook2Id];
        Map<Id, PricebookEntry> result = new Map<Id, PricebookEntry>();
        for (PricebookEntry entry : pb) {
            result.put(entry.Product2Id, entry);
        }
        return result;
    }

    private static Map<Id, Product2> getProduct2Records(Set<Id> ids){
        List<Product2> products = [SELECT Id, Name, Type__c FROM Product2 WHERE Id IN :ids];
        Map<Id, Product2> result = new Map<Id, Product2>(products);
        return result;
    }

    @AuraEnabled(cacheable = true)
    public static List<MenuItem> getMenuItems(Id pricebook2Id) {
        Map<Id, PricebookEntry> pricebooks = getPricebookEntryRecords(pricebook2Id);
        Map<Id, Product2> products = getProduct2Records(pricebooks.keySet());
        List<MenuItem> menuItems = new List<MenuItem>();
        for (Id productId : products.keySet()) {
            MenuItem item = new MenuItem();
            item.id = productId;
            item.name = products.get(productId).Name;
            item.price = pricebooks.get(productId).UnitPrice;
            item.quantity = 0;
            item.type = products.get(productId).Type__c;
            menuItems.add(item);
        }
        return menuItems;
    }

    @AuraEnabled
    public static Boolean submitOrder(OrderDetails details, List<MenuItem> items) {
        Order order = new Order();
        order.AccountId = details.accountId;
        String[] strTimeSplit = details.deliveryTime.split(':');
        Time timeChange = Time.newInstance( Integer.valueOf(strTimeSplit[0]) //hour
                                           ,Integer.valueOf(strTimeSplit[1]) //min
                                           ,0                                //sec
                                           ,0);
        order.EffectiveDate = Date.today();      
        order.Delivery_date_and_time__c = Datetime.newInstanceGmt(Date.today(), timeChange);
        order.Order_comment__c = details.comment;
        order.Notify_when_ready__c = details.notify;
        order.Status = 'Accepted';
        order.Pricebook2Id = details.pricebookId;
        order.Contact__c = details.contactId;
        order.User_ID__c = UserInfo.getUserId();
        insert order;

        Set<Id> productIds = new Set<Id>();
        for (MenuItem item : items) {
            productIds.add(item.id);
        }
        List<PricebookEntry> pricebookEntries = [SELECT id, Product2Id FROM PricebookEntry WHERE Pricebook2Id = :details.pricebookId AND Product2Id IN :productIds];
        Map<Id, Id> junctionIds = new Map<Id, Id>();
        for (PricebookEntry item : pricebookEntries) {
            junctionIds.put(item.Product2Id, item.id);
        }

        List<OrderItem> orderItems = new List<OrderItem>();
        for (MenuItem item : items) {
            if (item.quantity != 0) {
                OrderItem orderItem = new OrderItem();
                orderItem.OrderId = order.Id;
                orderItem.Quantity = item.quantity;
                orderItem.UnitPrice = item.price;
                orderItem.Product2Id = item.id;
                orderItem.PricebookEntryId = junctionIds.get(item.id);
                orderItems.add(orderItem);
            }
        }
        insert orderItems;

        return true;
    }
}