module.exports = (api) => {
    api.cache(true);
    return {
        presets: [
            'next/babel',
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-typescript',
        ]
    };
};
