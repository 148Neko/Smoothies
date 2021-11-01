import getMenuItems from '@salesforce/apex/MenuItems.getMenuItems';

function parseData(response) {
    return response;
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