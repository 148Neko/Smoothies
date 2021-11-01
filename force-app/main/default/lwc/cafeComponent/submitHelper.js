import submitOrder from '@salesforce/apex/MenuItems.submitOrder';

export default function submitHelper({ details, data }) {
    return submitOrder({ details: details, items: data })
    .then(result => {
        return true;
    })
    .catch(error => {
        console.log('Runtime error:' + error);
    });
}