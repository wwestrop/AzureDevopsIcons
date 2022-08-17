chrome.action.onClicked.addListener(navigateButtonClicked);

function navigateButtonClicked(tab, onclickData) {

    getDevOpsUrl().then(devOpsUrl => {
        // middle click
        if (onclickData.button === 1) {
            // or, onclickData.modifiers.contains("Ctrl")
            chrome.tabs.create({ url: devOpsUrl });
        }
        else {
            chrome.tabs.update(tab.tabId, { url: devOpsUrl });
        }
    });
}



chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    const url = changeInfo.url;
    if (!url) {
        return;
    }

    if (!url.includes(".visualstudio.com/") && !url.includes("//dev.azure.com/")) {
        return;
    }

    chrome.tabs.sendMessage(tabId, {
        command: { type: "updateFavicon" }
    });

});


function getDevOpsUrl() {

    const urlSuffix = chrome.runtime.getManifest().extension_params.urlSuffix;

    return chrome.storage.sync.get("devopsHomepage").then(u => {

        if (!u && !u.devopsHomepage) console.error("You need to set your settings");

        u = u.devopsHomepage;
        if (!u.endsWith("/")) u += "/";
        return u + urlSuffix;
    });
}