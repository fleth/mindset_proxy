chrome.app.runtime.onLaunched.addListener(function () {
    chrome.app.window.create('main.html', {
        id: "mainwin",
        resizable: false
    });
});
