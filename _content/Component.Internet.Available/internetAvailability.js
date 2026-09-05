window.internetAvailability = {
    dotNetRef: null,
    
    init: function (dotNetRef) {
        this.dotNetRef = dotNetRef;
        
        window.addEventListener('online', this.handleConnectionChange.bind(this));
        window.addEventListener('offline', this.handleConnectionChange.bind(this));
    },

    isOnline: function () {
        return navigator.onLine;
    },

    handleConnectionChange: function () {
        if (this.dotNetRef) {
            this.dotNetRef.invokeMethodAsync('OnJsNetworkStatusChanged', navigator.onLine);
        }
    },

    dispose: function () {
        window.removeEventListener('online', this.handleConnectionChange.bind(this));
        window.removeEventListener('offline', this.handleConnectionChange.bind(this));
        this.dotNetRef = null;
    }
};
