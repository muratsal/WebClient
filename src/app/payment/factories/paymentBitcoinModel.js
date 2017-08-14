angular.module('proton.payment')
    .factory('paymentBitcoinModel', ($rootScope, Payment, networkActivityTracker, CONSTANTS) => {

        const load = angular.noop;
        const CACHE = {};
        const TYPE_DONATION = 'donation';
        const { MIN_BITCOIN_AMOUNT } = CONSTANTS;

        const dispacth = (type, data = {}) => $rootScope.$emit('payment', { type, data });

        const set = (key, value) => (CACHE[key] = value);
        const get = (key) => angular.copy(key ? CACHE[key] : CACHE);
        const reset = () => {
            CACHE.input = null;
            CACHE.payment = null;
        };

        const generate = ({ amount, currency, type }) => {
            reset();
            set('input', { amount, currency, type });

            if (amount < MIN_BITCOIN_AMOUNT) {
                return dispacth('bitcoin.validator.error', { type: 'amount' });
            }

            const promise = Payment.btc(amount, currency)
                .then(({ data = {} }) => {
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    return data;
                })
                .then((data) => (set('payment', data), data))
                .then((data) => dispacth('bitcoin.success', data))
                .catch((error) => {
                    dispacth('bitcoin.error', error);
                    throw error;
                });

            networkActivityTracker.track(promise);
        };

        const isDonation = () => get('input').type === TYPE_DONATION;

        $rootScope.$on('payment', (e, { type, data }) => {
            (type === 'bitcoin.submit') && generate(data);
        });

        return { get, load, isDonation };
    });