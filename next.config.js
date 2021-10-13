module.exports = {
    reactStrictMode: true,
    redirects: async () => [
        {
            source: '/',
            destination: '/orders',
            permanent: false
        }
    ]
};
