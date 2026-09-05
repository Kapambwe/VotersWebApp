window.supportWidgetInterop = {
    consoleLogs: [],
    maxConsoleLogs: 50,

    initErrorTracking: function (dotNetHelper) {
        const self = this;

        // Intercept console.error and console.warn statements
        const originalError = console.error;
        const originalWarn = console.warn;

        console.error = function (...args) {
            self.captureLog("ERROR", args);
            originalError.apply(console, args);
        };

        console.warn = function (...args) {
            self.captureLog("WARN", args);
            originalWarn.apply(console, args);
        };

        // Capture global unhandled window errors
        window.onerror = function (message, source, lineno, colno, error) {
            const errorDetails = {
                type: error ? error.name : "UnhandledException",
                message: message ? message.toString() : "Unknown error",
                stackTrace: error ? error.stack : `At ${source}:${lineno}:${colno}`,
                url: window.location.href,
                consoleLogs: self.consoleLogs.slice()
            };

            dotNetHelper.invokeMethodAsync("OnBrowserUnhandledException", errorDetails);
        };

        // Capture global unhandled promise rejections
        window.onunhandledrejection = function (event) {
            const reason = event.reason;
            const errorDetails = {
                type: reason && reason.name ? reason.name : "UnhandledPromiseRejection",
                message: reason && reason.message ? reason.message : String(reason),
                stackTrace: reason && reason.stack ? reason.stack : "",
                url: window.location.href,
                consoleLogs: self.consoleLogs.slice()
            };

            dotNetHelper.invokeMethodAsync("OnBrowserUnhandledException", errorDetails);
        };
    },

    captureLog: function (level, args) {
        try {
            const timestamp = new Date().toISOString();
            const message = args.map(arg => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ");
            this.consoleLogs.push(`[${timestamp}] [${level}] ${message}`);
            if (this.consoleLogs.length > this.maxConsoleLogs) {
                this.consoleLogs.shift();
            }
        } catch (e) {
            // Ignore logging serialization errors
        }
    },

    getBrowserTelemetry: function () {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            currentUrl: window.location.href
        };
    },

    getRecentConsoleLogs: function () {
        return this.consoleLogs;
    }
};
