import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

export const initGA = () => {
    if (MEASUREMENT_ID === 'G-XXXXXXXXXX') {
        console.warn('Google Analytics Measurement ID is missing. Using placeholder.');
    }
    ReactGA.initialize(MEASUREMENT_ID);
};

export const logPageView = () => {
    ReactGA.send({ hitType: 'pageview', page: window.location.pathname + window.location.search });
};

export const logEvent = (category: string, action: string, label?: string) => {
    ReactGA.event({
        category,
        action,
        label,
    });
};

// E-commerce Events
export const logViewItem = (item: any) => {
    ReactGA.event('view_item', {
        currency: 'USD',
        value: item.price,
        items: [
            {
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                quantity: 1
            }
        ]
    });
};

export const logAddToCart = (item: any, quantity: number) => {
    ReactGA.event('add_to_cart', {
        currency: 'USD',
        value: item.price * quantity,
        items: [
            {
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                quantity: quantity
            }
        ]
    });
};

export const logViewCart = (items: any[], total: number) => {
    ReactGA.event('view_cart', {
        currency: 'USD',
        value: total,
        items: items.map(item => ({
            item_id: item.product_id,
            item_name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
        }))
    });
};

export const logBeginCheckout = (items: any[], total: number) => {
    ReactGA.event('begin_checkout', {
        currency: 'USD',
        value: total,
        items: items.map(item => ({
            item_id: item.product_id,
            item_name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
        }))
    });
};

export const logPurchase = (transactionId: string, items: any[], total: number) => {
    ReactGA.event('purchase', {
        transaction_id: transactionId,
        currency: 'USD',
        value: total,
        items: items.map(item => ({
            item_id: item.product_id,
            item_name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
        }))
    });
};

export const logLogin = (method: string) => {
    ReactGA.event('login', {
        method
    });
};

export const logSignUp = (method: string) => {
    ReactGA.event('sign_up', {
        method
    });
};
