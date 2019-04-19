const HtmlWebpackPlugin = require('html-webpack-plugin')

export default service => {
    return new HtmlWebpackPlugin(service.config.html)
};
