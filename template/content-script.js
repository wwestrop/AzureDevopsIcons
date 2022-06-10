"use strict";

browser.runtime.onMessage.addListener((message) => {
    if (message.command.type === "updateFavicon") {
        updateFavicon();
    }
    else if (message.command.type === "warnUnconfiguredUrl") {
        alert("You've not configured a base URL for the extension");
        // If you want the shortcut buttons to work you have to do this
        // for every extension. Sorry.
    }
});


updateFavicon();    // when the extension is first loaded


function updateFavicon() {

    try {
        setIcon(getIcon());
    }
    catch (e) {
        console.error("failed " + e);
    }
}

function getIcon() {

    const url = window.location.href;

    if (url.includes("/_dashboards")
        || url.includes("/_analytics")
        || url.includes("/_wiki")) {
        return "https://cdn.vsassets.io/ext/ms.vss-tfs-web/platform-content/Nav-Dashboard.S24hPDN9_BLImMxi.png";
    }
    else if (url.includes("/_workitems")
        || url.includes("/_boards")
        || url.includes("/_backlogs")
        || url.includes("/sprints")
        || url.includes("/_queries")
        || url.includes("/_deliveryplans/")) {
        return "https://cdn.vsassets.io/ext/ms.vss-work-web/common-content/Content/Nav-Plan.XB8qU6v7kvBk_Tcy.png";
    }
    else if (url.includes("/_git/")) {
        return "https://cdn.vsassets.io/ext/ms.vss-code-web/common-content/Nav-Code.0tJczmQtl3hyKtlh.png";
    }
    else if (url.includes("/_build")
        || url.includes("/_environments")
        || url.includes("/_release")
        || url.includes("/_library")
        || url.includes("/_taskgroups")
        || url.includes("/_machinegroup")) {


        // additionally check for "_build/results?" or _build?definitionId
        // to show the "is this build running" spinner icon

        return "https://cdn.vsassets.io/ext/ms.vss-build-web/common-library/Nav-Launch.3tiJhd8JGiL0mrog.png";
    }
    else if (url.includes("/_testPlans")
        || url.includes("/_testManagement/")) {
        return "https://cdn.vsassets.io/ext/ms.vss-test-web/common-content/Nav-Test.CLbC8LbdE5__mhtfT.png";
    }
    else if (url.includes("/_artifacts")) {
        return "https://ms.gallerycdn.vsassets.io/extensions/ms/azure-artifacts/18.203.0.107787320/1652983730116/root/img/artifacts-icon.png";
    }
}

function setIcon(iconUrl) {
    const icon = document.querySelector("head link[rel='shortcut icon']");
    icon.href = iconUrl;
}