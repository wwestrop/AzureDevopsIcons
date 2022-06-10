
browser.browserAction.onClicked.addListener(navigateButtonClicked);

function navigateButtonClicked(tab, onclickData) {

    getDevOpsUrl().then(devOpsUrl => {
        // middle click
        if (onclickData.button === 1) {
            // or, onclickData.modifiers.contains("Ctrl")
            browser.tabs.create({ url: devOpsUrl });
        }
        else {
            browser.tabs.update(tab.tabId, { url: devOpsUrl });
        }
    });
}



browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    const url = changeInfo.url;
    if (!url) {
        return;
    }

    if (!url.includes(".visualstudio.com/") && !url.includes("//dev.azure.com/")) {
        return;
    }

    browser.tabs.sendMessage(tabId, {
        command: { type: "updateFavicon" }
    });

});


function getDevOpsUrl() {

    const urlSuffix = browser.runtime.getManifest().extension_params.urlSuffix;

    return browser.storage.sync.get("devopsHomepage").then(u => {

        if (!u && !u.devopsHomepage) console.error("You need to set your settings");

        u = u.devopsHomepage;
        if (!u.endsWith("/")) u += "/";
        return u + urlSuffix;
    });
}