function CookieStore() {
    const COOKIE_NAME = 'code';
    const COOKIE_TTL = 400;     // Date of expiry in days from creation.

    this.getCode = function () {
        const cookies = document.cookie.split(';');
        for (let ca of cookies) {
            ca = ca.trimStart();
            if (ca.includes(COOKIE_NAME)) return ca.substring(COOKIE_NAME.length + 1);
        }
    };

    this.setCode = function (code) {
        let date = new Date();
        date.setTime(date.getTime() + (COOKIE_TTL * 24 * 60 * 60 * 1000)); // convert to miliseconds
        let expiry = "expires=" + date.toUTCString();
        document.cookie = COOKIE_NAME + "=" + code + ";" + expiry + ";path=/";
    };

    this.clearCode = function () {
        let date = new Date();
        date.setTime(date.getTime() - (10000)); // Time in the past
        let expiry = "expires=" + date.toUTCString();
        document.cookie = COOKIE_NAME + "=" + ";" + expiry + ";path=/";
    }
}
