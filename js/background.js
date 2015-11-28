chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
    id: "mainwin",
    'innerBounds': {
      minWidth: 300,
      minHeight: 150,
      maxWidth: 300,
      maxHeight: 150,
    }
  });
});
