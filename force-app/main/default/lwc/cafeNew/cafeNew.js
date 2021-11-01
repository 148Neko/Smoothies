import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchDataHelper from './fetchDataHelper';
import submitHelper from './submitHelper.js';

const columns = [
    { label: 'Name', fieldName: 'name', hideDefaultActions: true },
    { label: 'Price', fieldName: 'price', type: 'currency', hideDefaultActions: true },
    { type: "button-icon", fieldName: '-', hideDefaultActions: true, typeAttributes: { iconName: 'utility:dash',
                                                                                       title: 'Remove from cart',
                                                                                       name: '-',
                                                                                       value: '-',
                                                                                       class: {fieldName: 'btnVisibility'}}, 
                                                                cellAttributes: {alignment: 'right' } },
    { label: 'Quantity', fieldName: 'quantity', initialWidth: 80, hideDefaultActions: true, cellAttributes: {alignment: 'center' } },
    { type: "button-icon", fieldName: '+', hideDefaultActions: true, typeAttributes: { iconName: 'utility:add',
                                                                                       title: 'Add to cart',
                                                                                       name: '+',
                                                                                       value: '+',
                                                                                       class: {fieldName: 'btnVisibility'}}, 
                                                                     cellAttributes: {alignment: 'left' } },
];
const OPENING_TIME = "10:00:00.000Z";
const CLOSING_TIME = "20:00:00.000Z";
const TIME_FOR_COOKING = 60 * 60 * 1000; /* 1h in ms */
const TIME_FOR_MAKE_ORDER = 5 * 60 * 1000; /* 5m in ms */

export default class CafeComponent extends LightningElement {
    standardPriceBookId = '01s0900000FriGgAAJ'; // menu
    standardAccountId = '0010900000kuK8Q'; // cafe
    standardContactId = '0030900000ggNTyAAM'; // user
    @track data = [];
    @track totalPrice = 0;
    @track deliveryTime = '';
    @track notify = true;
    @track isModalOpen = false;
    @track headerText = '';
    @track bodyText = '';
    @track openingTime = OPENING_TIME;
    @track closingTime = CLOSING_TIME;
    comment = '';
    columns = columns;

    processAction(action, item) {
        if (action === '+') {
            item.quantity++;
        } else if (action === '-' && item.quantity !== 0) {
            item.quantity--;
        }
    }

    calculateTotalPrice(action, row) {
        let totalPrice = 0;
        // NOTE: this is a workaround to fix writing to read-only property,
        // more here https://www.salesforcepoint.com/2020/08/how-to-fix-cannot-assign-to-read-only.html
        let tempData = Object.assign([], this.data);
        for (let j = 0; j < tempData.length; j++) {
            let tempChildren = Object.assign([], tempData[j]._children);
            for (let k = 0; k < tempChildren.length; k++) {
                let tempItem = Object.assign({}, tempChildren[k]);
                if (row.id === tempItem.id) {
                    this.processAction(action, tempItem);
                }
                let total = tempItem.price * tempItem.quantity;
                totalPrice = Math.round((totalPrice + total + Number.EPSILON) * 100) / 100;
                tempChildren[k] = tempItem;
            }
            tempData[j]._children = tempChildren;
        }
        this.data = tempData;

        return totalPrice;
    }

    rowAction(event) {
        this.totalPrice = this.calculateTotalPrice(event.detail.action.name, event.detail.row);
    }

    handleDeliveryTimeChange(event) {
        this.deliveryTime = event.target.value;
    }

    handleNotifyChange(event) {
        this.notify = event.target.checked;
    }

    handleCommentChange(event) {
        this.comment = event.target.value;
    }

    async handleSubmit() {
        if (!this.validateOrder()) {
            return;
        }

        let orderDetails = {
            accountId: this.standardAccountId,
            priceBookId: this.standardPriceBookId,
            contactId: this.standardContactId,
            deliveryTime: this.deliveryTime,
            comment: this.comment,
            notify: this.notify
        }
        let result = await submitHelper( { details: orderDetails, data: this.data } );
        this.handleResult(result, 'Can\'t submit the order. Please try again later.');
    }

    submitOk() {
        this.isModalOpen = false;
    }

    handleResult(success, errorMessage) {
        this.headerText = success ? 'The order was created' : 'Something went wrong...';
        this.bodyText = success ? 'We will notify you when the order will be ready, or no' : errorMessage;
        this.isModalOpen = true;
        this.showToast(success, errorMessage);
        if (success) {
            this.clearOrders();
        }
    }

    showToast(success, errorMessage) {
        const event = new ShowToastEvent({
            title: success ? 'The order was created' : 'Something went wrong',
            message: success ? 'We will notify you when the order will be ready, or no...' : errorMessage,
            variant: success ? 'success' : 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    clearOrders() {
        let tempData = Object.assign([], this.data);
        for (let j = 0; j < tempData.length; j++) {
            let tempChildren = Object.assign([], tempData[j]._children);
            for (let k = 0; k < tempChildren.length; k++) {
                let tempItem = Object.assign({}, tempChildren[k]);
                tempItem.quantity = 0;
                tempChildren[k] = tempItem;
            }
            tempData[j]._children = tempChildren;
        }
        this.data = tempData;

        this.totalPrice = 0;
    }

    validateOrder() {
        let errorMessage = 'The cart is empty! Order something...';
        let result = false;
        for (let item of this.data) {
            if (item.quantity != 0) {
                result = true;
                errorMessage = '';
                break;
            }
        }

        // check time
        let expectedDate = new Date();
        let currentTimeMs = (expectedDate.getHours() * 60 + expectedDate.getMinutes()) * 60 * 1000;
        let parts = this.deliveryTime.match(/(\d+):(\d+)/);
        let hours = parseInt(parts[1], 10);
        let minutes = parseInt(parts[2], 10);
        let deliveryTimeMs = (hours * 60 + minutes) * 60 * 1000;

        if ((deliveryTimeMs - currentTimeMs) < TIME_FOR_COOKING) {
            result = false;
            errorMessage = 'Please pick another time.';
        }

        if (!result) {
            this.handleResult(result, errorMessage);
        }
        return result;
    }

    async connectedCallback() {
        let today = new Date(new Date().getTime() + TIME_FOR_COOKING + TIME_FOR_MAKE_ORDER);
        let extraZero = today.getMinutes() < 10 ? '0' : '';
        let hours = today.getHours();
        this.deliveryTime = hours + ':' + extraZero + today.getMinutes();
        this.data = await fetchDataHelper({ priceBookId: this.standardPriceBookId });
        if (this.data === undefined) {
            this.handleResult(false, 'Can\'t whow the menu, try again later.');
        }
    }
}