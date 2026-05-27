class LimitExceededError extends Error {
    constructor(message, limitType, maxLimit, currentCount) {
        super(message);
        this.name = "LimitExceededError";
        this.statusCode = 403;
        this.limitType = limitType;
        this.maxLimit = maxLimit;
        this.currentCount = currentCount;
    }
}

module.exports = LimitExceededError;
