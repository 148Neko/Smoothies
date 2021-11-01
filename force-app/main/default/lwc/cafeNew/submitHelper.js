import submitOrder from '@salesforce/apex/MenuItems.submitOrder';

function parseData(data) {
    let result = [];
    for (let item of data) {
        for (let subItem of item._children) {
            result.push(subItem);
        }
    }
    return result;
}

export default function submitHelper({ details, data }) {
    return submitOrder({ details: details, items: parseData(data)})
    .then(result => {
        return true;
    })
    .catch(error => {
        console.log('Runtime error:' + error);
    });
}