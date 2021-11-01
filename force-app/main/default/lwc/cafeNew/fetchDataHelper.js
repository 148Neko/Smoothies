import getMenuItems from '@salesforce/apex/MenuItems.getMenuItems';

function parseData(response) {
    let categories = new Map();
    for (let item of response) {
        // TODO: hanle undefined type
        if (!categories.has(item.type)) {
            categories.set(item.type, []);
        }
        let arr = categories.get(item.type);
        let tempItem = Object.assign({}, item);
        tempItem.btnVisibility = 'slds-visible';
        tempItem.rowType = 'item',
        arr.push(tempItem);
    }

    let data = [];
    for (const [key, value] of categories.entries()) {
        let item = {
            id: key,
            name: key,
            btnVisibility: 'slds-hidden',
            rowType: 'category',
            _children: value
        };
        data.push(item);
    }

    return data;
}

export default function fetchDataHelper({ priceBookId }) {
    return getMenuItems({pricebook2Id : priceBookId})
    .then(result => {
        return parseData(result);
    })
    .catch(error => {
        console.log('Runtime error:' + error);
    });
}