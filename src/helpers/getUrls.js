const getUrlBase = (req) => {
    return `${req.protocol}://${req.get("host")}`;
};

const getUrl = (req) => {
    return `${req.protocol}://${req.get("host")}${req.originalUrl}`;
};

module.exports = {
    getUrl,
    getUrlBase,
};
