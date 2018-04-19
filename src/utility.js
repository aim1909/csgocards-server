const utility = {
    getCookieValue(cookieString, key) {
        const b = cookieString.match('(^|;)\\s*' + key + '\\s*=\\s*([^;]+)');
        return b ? b.pop() : undefined;
    }
};

module.exports = utility;